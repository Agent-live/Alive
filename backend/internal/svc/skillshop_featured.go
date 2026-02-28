package svc

import (
	"context"
	"strings"

	"backend/ent"
	"backend/ent/agentskill"
	"backend/ent/user"
	"backend/internal/skillshop"
)

const (
	skillShopFeaturedUserEmail    = "skillshop@alive.local"
	skillShopFeaturedUserNickname = "ALIVE Skill Shop"
)

// bootstrapSkillShopFeatured seeds the "featured 26" AliveAgent skills into the Alive database.
//
// We store them as lesson templates owned by a dedicated system user so:
// - the backend can install them without GitHub fetches
// - the selection is easy to change without schema changes
func bootstrapSkillShopFeatured(ctx context.Context, db *ent.Client) error {
	sysUser, err := ensureSkillShopFeaturedUser(ctx, db)
	if err != nil {
		return err
	}

	catalog, err := skillshop.LoadCatalog()
	if err != nil {
		return err
	}

	for _, slug := range skillshop.FeaturedSlugs() {
		if strings.TrimSpace(slug) == "" {
			continue
		}

		exists, err := db.AgentSkill.Query().
			Where(
				agentskill.OwnerUserID(sysUser.ID),
				agentskill.DeletedAtIsNil(),
				agentskill.StatusEQ("lesson"),
				agentskill.NameEQ(slug),
			).
			Exist(ctx)
		if err != nil {
			return err
		}
		if exists {
			continue
		}

		it, ok := catalog.GetBySlug(slug)
		if !ok {
			continue
		}

		md, err := skillshop.FetchSkillMarkdown(ctx, it)
		if err != nil {
			return err
		}
		instructions := strings.TrimSpace(skillshop.StripFrontmatter(md))
		if instructions == "" {
			continue
		}

		_, err = db.AgentSkill.Create().
			SetOwnerUserID(sysUser.ID).
			SetName(it.Slug).
			SetDescription(strings.TrimSpace(it.Description)).
			SetInstructions(instructions).
			SetStatus("lesson").
			SetCategory(skillshop.MapShopCategoryToInternal(it.Category)).
			Save(ctx)
		if err != nil {
			// Best-effort: ignore conflicts (bootstrapping is idempotent).
			if ent.IsConstraintError(err) {
				continue
			}
			return err
		}
	}

	return nil
}

func ensureSkillShopFeaturedUser(ctx context.Context, db *ent.Client) (*ent.User, error) {
	row, err := db.User.Query().Where(user.EmailEQ(skillShopFeaturedUserEmail)).Only(ctx)
	if err == nil {
		return row, nil
	}
	if !ent.IsNotFound(err) {
		return nil, err
	}
	return db.User.Create().
		SetEmail(skillShopFeaturedUserEmail).
		SetNickname(skillShopFeaturedUserNickname).
		SetTheme("system").
		SetLanguage("en-US").
		Save(ctx)
}

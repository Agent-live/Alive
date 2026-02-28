package svc

import (
	"context"
	"os"
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

	featured := skillshop.FeaturedSlugs()
	if len(featured) == 0 {
		return nil
	}

	existingRows, err := db.AgentSkill.Query().
		Where(
			agentskill.OwnerUserID(sysUser.ID),
			agentskill.DeletedAtIsNil(),
			agentskill.StatusEQ("lesson"),
			agentskill.NameIn(featured...),
		).
		All(ctx)
	if err != nil {
		return err
	}
	existing := make(map[string]bool, len(existingRows))
	for _, row := range existingRows {
		key := strings.ToLower(strings.TrimSpace(row.Name))
		if key == "" {
			continue
		}
		existing[key] = true
	}

	missing := make([]string, 0, len(featured))
	for _, slug := range featured {
		clean := strings.TrimSpace(slug)
		if clean == "" {
			continue
		}
		if existing[strings.ToLower(clean)] {
			continue
		}
		missing = append(missing, clean)
	}
	if len(missing) == 0 {
		return nil
	}

	// Use the embedded catalog only: local full-repo scans are expensive and can block startup.
	catalog, err := skillshop.LoadBundledCatalog()
	if err != nil {
		return err
	}

	for _, slug := range missing {
		it, ok := catalog.GetBySlug(slug)
		if !ok {
			continue
		}

		desc := strings.TrimSpace(it.Description)
		instructions := desc
		if instructions == "" {
			instructions = "Open the upstream skill doc for full instructions."
		}

		// Prefer local SKILL.md contents when available; avoid network fetches in startup path.
		if fullPath, ok := skillshop.LocalRepoPath(it.RepoPath); ok {
			if b, err := os.ReadFile(fullPath); err == nil {
				if parsed := strings.TrimSpace(skillshop.StripFrontmatter(string(b))); parsed != "" {
					instructions = parsed
				}
			}
		}

		_, err = db.AgentSkill.Create().
			SetOwnerUserID(sysUser.ID).
			SetName(it.Slug).
			SetDescription(desc).
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

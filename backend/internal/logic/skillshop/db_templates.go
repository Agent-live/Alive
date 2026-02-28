package skillshop

import (
	"context"

	"backend/ent"
	"backend/ent/user"
	"backend/internal/svc"

	"github.com/google/uuid"
)

const skillShopFeaturedUserEmail = "skillshop@alive.local"

func featuredSkillShopUserID(ctx context.Context, svcCtx *svc.ServiceContext) (uuid.UUID, bool, error) {
	u, err := svcCtx.DB.User.Query().Where(user.EmailEQ(skillShopFeaturedUserEmail)).Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return uuid.Nil, false, nil
		}
		return uuid.Nil, false, err
	}
	return u.ID, true, nil
}

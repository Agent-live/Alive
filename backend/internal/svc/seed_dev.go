package svc

import (
	"context"

	"backend/ent"
)

// bootstrapDevSeedData seeds all mock/test data required for local development.
// It must only be called in dev mode.
func bootstrapDevSeedData(ctx context.Context, db *ent.Client) error {
	if err := bootstrapTestUser(ctx, db); err != nil {
		return err
	}
	if err := bootstrapDefaultUserAndAgent(ctx, db); err != nil {
		return err
	}
	if err := bootstrapProfileData(ctx, db); err != nil {
		return err
	}
	if err := bootstrapConversations(ctx, db); err != nil {
		return err
	}
	if err := bootstrapMockSocialGraph(ctx, db); err != nil {
		return err
	}
	return nil
}

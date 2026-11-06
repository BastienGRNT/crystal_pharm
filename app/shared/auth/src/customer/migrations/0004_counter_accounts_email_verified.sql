-- Sans email, un compte comptoir n'a rien à vérifier ; non vérifié, il ne pourrait plus se connecter.
UPDATE "auth"."users" SET "email_verified" = true WHERE "username" IS NOT NULL;

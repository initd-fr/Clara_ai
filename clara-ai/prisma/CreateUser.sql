
INSERT INTO "User" ("id", "isPaid", "accountType", "email", "password", "role", "firstName", "lastName", "dailyMessages")
VALUES (
  gen_random_uuid(), 
  true, -- Compte premium (payant)
  'premium',  -- Type de compte (base ou premium)
  '', -- Email
  '', -- Mot de passe hashé
  '', -- Rôle ( user ou support)
  '', -- Prénom
  '', -- Nom
  50 -- Nombre de messages par jour par défaut
);
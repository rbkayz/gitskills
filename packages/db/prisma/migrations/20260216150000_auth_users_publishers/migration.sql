CREATE TYPE app_user_role AS ENUM ('user', 'admin');
CREATE TYPE app_user_status AS ENUM ('active', 'suspended');
CREATE TYPE publisher_member_role AS ENUM ('owner', 'maintainer');

CREATE TABLE app_user (
  id text NOT NULL DEFAULT generate_prefixed_id('usr_'),
  github_id text NOT NULL,
  github_login text NOT NULL,
  email text,
  display_name text,
  avatar_url text,
  role app_user_role NOT NULL DEFAULT 'user',
  status app_user_status NOT NULL DEFAULT 'active',
  created_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp(3) NOT NULL,
  CONSTRAINT app_user_pkey PRIMARY KEY (id)
);

CREATE TABLE publisher_member (
  id text NOT NULL DEFAULT generate_prefixed_id('pmb_'),
  publisher_id text NOT NULL,
  user_id text NOT NULL,
  role publisher_member_role NOT NULL DEFAULT 'maintainer',
  created_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp(3) NOT NULL,
  CONSTRAINT publisher_member_pkey PRIMARY KEY (id),
  CONSTRAINT publisher_member_publisher_id_fkey FOREIGN KEY (publisher_id) REFERENCES publisher(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT publisher_member_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX app_user_github_id_key ON app_user(github_id);
CREATE UNIQUE INDEX app_user_github_login_key ON app_user(github_login);
CREATE UNIQUE INDEX app_user_email_key ON app_user(email);
CREATE INDEX app_user_role_idx ON app_user(role);
CREATE INDEX app_user_status_idx ON app_user(status);

CREATE UNIQUE INDEX publisher_member_publisher_id_user_id_key ON publisher_member(publisher_id, user_id);
CREATE INDEX publisher_member_publisher_id_role_idx ON publisher_member(publisher_id, role);
CREATE INDEX publisher_member_user_id_idx ON publisher_member(user_id);

ALTER TABLE app_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE publisher_member ENABLE ROW LEVEL SECURITY;

CREATE POLICY app_user_service_only
  ON app_user
  FOR ALL
  USING (
    current_user IN ('postgres', 'service_role')
    OR current_setting('request.jwt.claim.role', true) = 'service_role'
  )
  WITH CHECK (
    current_user IN ('postgres', 'service_role')
    OR current_setting('request.jwt.claim.role', true) = 'service_role'
  );

CREATE POLICY publisher_member_service_only
  ON publisher_member
  FOR ALL
  USING (
    current_user IN ('postgres', 'service_role')
    OR current_setting('request.jwt.claim.role', true) = 'service_role'
  )
  WITH CHECK (
    current_user IN ('postgres', 'service_role')
    OR current_setting('request.jwt.claim.role', true) = 'service_role'
  );

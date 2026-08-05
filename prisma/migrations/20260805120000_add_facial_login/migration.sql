CREATE TABLE IF NOT EXISTS public.user_face_enrollments (
  id bigserial PRIMARY KEY,
  user_id bigint NOT NULL,
  rekognition_face_id varchar(100) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'active',
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  CONSTRAINT user_face_enrollments_rekognition_face_id_key UNIQUE (rekognition_face_id),
  CONSTRAINT user_face_enrollments_user_id_fk
    FOREIGN KEY (user_id)
    REFERENCES public.users(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_face_enrollments_user_id
  ON public.user_face_enrollments(user_id);

CREATE TABLE IF NOT EXISTS public.trusted_devices (
  id bigserial PRIMARY KEY,
  user_id bigint NOT NULL,
  device_token_hash varchar(64) NOT NULL,
  label varchar(150),
  status varchar(20) NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  revoked_at timestamptz,
  CONSTRAINT trusted_devices_device_token_hash_key UNIQUE (device_token_hash),
  CONSTRAINT trusted_devices_user_id_fk
    FOREIGN KEY (user_id)
    REFERENCES public.users(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id
  ON public.trusted_devices(user_id);

CREATE TABLE IF NOT EXISTS public.face_login_attempts (
  id bigserial PRIMARY KEY,
  device_token_hash varchar(64),
  ip varchar(45),
  matched_user_id bigint,
  similarity numeric(5, 2),
  success boolean NOT NULL,
  reason varchar(50),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_face_login_attempts_device_token_hash
  ON public.face_login_attempts(device_token_hash);
CREATE INDEX IF NOT EXISTS idx_face_login_attempts_created_at
  ON public.face_login_attempts(created_at);

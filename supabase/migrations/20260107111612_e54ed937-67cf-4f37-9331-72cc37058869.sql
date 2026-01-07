-- Drop the existing admin-only policy
DROP POLICY IF EXISTS "Admins can manage integration tokens" ON public.integration_tokens;

-- Create policy for teachers to manage their own tokens
CREATE POLICY "Users can manage own integration tokens"
ON public.integration_tokens
FOR ALL
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);
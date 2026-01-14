-- Create webhook event log table
CREATE TABLE public.webhook_event_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload JSONB,
  status TEXT NOT NULL DEFAULT 'received',
  response JSONB,
  error_message TEXT,
  teacher_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Add index for faster teacher lookups
CREATE INDEX idx_webhook_event_logs_teacher ON public.webhook_event_logs(teacher_id);
CREATE INDEX idx_webhook_event_logs_created ON public.webhook_event_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.webhook_event_logs ENABLE ROW LEVEL SECURITY;

-- Teachers can view webhook logs for events they triggered or events that affected their classes
CREATE POLICY "Teachers can view their webhook logs"
ON public.webhook_event_logs
FOR SELECT
USING (
  teacher_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'teacher'
  )
);

-- Add comment for documentation
COMMENT ON TABLE public.webhook_event_logs IS 'Logs all incoming webhook events from NYCologic Ai for debugging and monitoring';
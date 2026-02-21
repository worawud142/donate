-- Add cash_note column to donations table
ALTER TABLE donations 
ADD COLUMN cash_note TEXT NULL;

-- Add comment to describe the column
COMMENT ON COLUMN donations.cash_note IS 'Notes for cash donations (e.g., who received the cash)';

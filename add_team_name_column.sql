-- Add team_name column to donations table
ALTER TABLE donations 
ADD COLUMN team_name TEXT NULL;

-- Add comment to describe the column
COMMENT ON COLUMN donations.team_name IS 'Team/organization name for non-alumni donors (e.g., sports team, company name)';

-- Add QuoteBox Games enrollment flag to accounts
alter table accounts add column games_enrolled boolean not null default false;

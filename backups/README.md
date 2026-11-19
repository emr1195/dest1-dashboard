# Local database backups

Neon database backups are stored here by `scripts/backup-neon.ps1`.

Backup archives and logs are intentionally excluded from Git because they contain
private application data. The Windows scheduled task runs every five days at
2:00 a.m. while the user session is available.

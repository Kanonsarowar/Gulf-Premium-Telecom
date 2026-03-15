# Fix Update Error - Quick Solution

## The Problem

You got this error:
```
error: The following untracked working tree files would be overwritten by merge:
        package-lock.json
Please move or remove them before you merge.
```

## Quick Fix (Run These Commands)

```bash
# 1. Navigate to your project
cd ~/Gulf-Premium-Telecom

# 2. Backup and remove the conflicting file
mv package-lock.json package-lock.json.backup

# 3. Pull the latest code
git pull origin copilot/build-asterisk-inbound-sip

# 4. Now run the update script
sudo ./update-server.sh
```

## What Happened?

- Your local `package-lock.json` was blocking the git pull
- The update script couldn't download because of this conflict
- The script itself wasn't pulled down yet

## Solution Implemented

✅ **Updated the script** to handle this automatically in the future!

The new `update-server.sh` will:
- Detect conflicting files
- Automatically backup them
- Retry the pull
- Continue with the update

✅ **Updated `.gitignore`** to ignore package-lock.json in the future

---

## Step-by-Step Recovery

### 1. Clean Up Conflict

```bash
cd ~/Gulf-Premium-Telecom

# Remove or backup the conflicting file
rm package-lock.json
# OR
mv package-lock.json package-lock.json.old
```

### 2. Pull Latest Code

```bash
git pull origin copilot/build-asterisk-inbound-sip
```

You should see:
```
Updating eb6d35d..83828df
Fast-forward
 .gitignore        |  4 ++++
 update-server.sh  | 45 +++++++++++++++++++++++++++++++--------------
 ...
```

### 3. Run Update Script

```bash
sudo ./update-server.sh
```

Now it should work perfectly! ✨

---

## Future Updates

From now on, just run:
```bash
sudo ./update-server.sh
```

The script will handle conflicts automatically! 🚀

---

## Verification

After successful update, you should see:
```
✅ Backend:  Running
✅ Frontend: Running

🌐 Access your system:
Dashboard: http://167.172.170.88
Backend:   http://167.172.170.88:3001/api
```

---

## Troubleshooting

### If git pull still fails:

```bash
# Check what's blocking
git status

# See what files are in the way
git clean -n

# Force clean untracked files (careful!)
git clean -fd

# Then try pull again
git pull origin copilot/build-asterisk-inbound-sip
```

### If services don't start:

```bash
# Check backend logs
sudo journalctl -u gulf-telecom-backend -n 50

# Check frontend logs
sudo journalctl -u gulf-telecom-frontend -n 50

# Restart manually
sudo systemctl restart gulf-telecom-backend
sudo systemctl restart gulf-telecom-frontend
```

---

## Prevention

The updated script now:
- ✅ Detects conflicts automatically
- ✅ Backs up conflicting files
- ✅ Retries after cleanup
- ✅ Continues even if some steps fail

**You shouldn't see this error again!** 🎉

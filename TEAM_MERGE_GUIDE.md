# Team Collaboration & Merge Guide

## Current Situation
✅ Your ML features are now in the `ml-features` branch
✅ Main branch is preserved without your changes
✅ Your team can work on their changes separately

## Branch Structure
```
main (clean, original state)
  └── ml-features (your ML work: disease detection, prices, weather)
```

---

## Scenario 1: Your Team Made Changes in Separate Repos

If your team has separate repositories for `agrismart-frontend` and `backend`:

### Step 1: Get your team's latest code

```bash
# For Frontend
cd agrismart-frontend
git remote add team-frontend https://github.com/TEAM_USERNAME/frontend-repo.git
git fetch team-frontend
git pull team-frontend main

# For Backend
cd ../backend
git remote add team-backend https://github.com/TEAM_USERNAME/backend-repo.git
git fetch team-backend
git pull team-backend main
```

### Step 2: Resolve any conflicts
If there are conflicts, Git will tell you which files. Edit them manually and then:
```bash
git add .
git commit -m "merge: Integrate team's frontend/backend changes"
```

### Step 3: Push merged changes
```bash
cd ..
git push origin ml-features
```

---

## Scenario 2: Your Team Made Changes in the Same Repo

If your team pushed to the same repository (different branch):

### Step 1: Fetch all branches
```bash
git fetch origin
```

### Step 2: See all branches
```bash
git branch -a
```

### Step 3: Merge team's branch into ml-features
```bash
# Make sure you're on ml-features branch
git checkout ml-features

# Merge team's branch (replace 'team-branch' with actual name)
git merge origin/team-branch
```

### Step 4: Resolve conflicts if any
```bash
# Check status
git status

# After resolving conflicts in files
git add .
git commit -m "merge: Integrate team changes with ML features"
git push origin ml-features
```

---

## Scenario 3: Merge ML Features into Main (After Testing)

Once everything is tested and working:

### Step 1: Switch to main
```bash
git checkout main
```

### Step 2: Pull latest main
```bash
git pull origin main
```

### Step 3: Merge ml-features into main
```bash
git merge ml-features
```

### Step 4: Push to main
```bash
git push origin main
```

---

## Common Git Commands You'll Need

### Check current branch
```bash
git branch
```

### Switch branches
```bash
git checkout branch-name
```

### See what changed
```bash
git status
git diff
```

### Undo uncommitted changes
```bash
git checkout -- filename
```

### See commit history
```bash
git log --oneline --graph --all
```

---

## Handling Merge Conflicts

When you see conflicts, Git will mark them in files like this:

```
<<<<<<< HEAD
Your changes
=======
Team's changes
>>>>>>> team-branch
```

### To resolve:
1. Open the conflicted file
2. Choose which code to keep (or combine both)
3. Remove the conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)
4. Save the file
5. Run:
```bash
git add filename
git commit -m "resolve: Fixed merge conflicts"
```

---

## Your Current Files Structure

### ML Server (Your work)
- `ml-server/app.py` - Main ML API
- `ml-server/plant_disease_model.h5` - Disease model
- `ml-server/models/` - Price models
- `ml-server/train_price_model.py` - Training script

### Backend (Shared with team)
- `backend/src/controllers/` - Your controllers
- `backend/src/services/` - Your services
- `backend/src/routes/` - Your routes

### Frontend (Shared with team)
- `agrismart-frontend/src/app/pages/` - Your pages
- `agrismart-frontend/src/app/services/api.js` - API integration

---

## Next Steps

1. **Ask your team**: Which repository/branch has their changes?
2. **Get the URL**: Frontend repo, backend repo, or branch name
3. **Follow the appropriate scenario above**
4. **Test everything together** before merging to main

---

## Quick Reference

```bash
# Create new branch
git checkout -b branch-name

# Switch branch
git checkout branch-name

# Pull team changes
git pull origin branch-name

# Merge another branch
git merge other-branch

# Push your branch
git push origin your-branch

# See all branches
git branch -a

# Delete local branch
git branch -d branch-name
```

---

## Need Help?

If you get stuck, run:
```bash
git status
```
This will tell you exactly what state you're in and what to do next.

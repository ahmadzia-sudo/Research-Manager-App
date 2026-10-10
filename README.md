# Manuscript Desk

A small web app for managing research papers: projects, a reusable author directory, a journal directory with review times calculated from your own history, funding statements, an internal funding pool, and a pipeline dashboard.

There is no database. Everything is saved as four JSON files (`users.json`, `authors.json`, `journals.json`, `projects.json`) inside a folder in **your own Google Drive**.

Built with Next.js 15 (React, TypeScript, Tailwind CSS). It runs on Vercel's free plan.

---

## What you will do (about 30 minutes, once)

1. Create Google keys so the app can save files in your Drive (Part A).
2. Put the code on GitHub (Part B).
3. Import it into Vercel and paste in the keys (Part C).
4. Open the site and create your admin account (Part D).

You do not need to install anything on your computer. Do every step in a normal web browser while signed in to the Google account whose Drive should hold the data.

Keep a text file open (Notepad is fine) to paste values into as you go. You will collect **six values**:

| Name | Where it comes from |
|---|---|
| `GOOGLE_CLIENT_ID` | Part A, step 6 |
| `GOOGLE_CLIENT_SECRET` | Part A, step 6 |
| `GOOGLE_REFRESH_TOKEN` | Part A, step 7 |
| `DRIVE_FOLDER_NAME` | You choose, e.g. `Research Manager Data` |
| `SESSION_SECRET` | You make up a long random string (Part C, step 4) |
| `SETUP_KEY` | You make up a secret word (Part C, step 4) |

---

## Part A: Google keys

Google renames buttons from time to time. If a label below looks slightly different, look for the closest match.

### Step 1. Open Google Cloud Console
Go to <https://console.cloud.google.com/> and sign in with your Google account. If it asks you to accept terms, accept them.

### Step 2. Create a project
1. At the top left, click the project picker (it may say "Select a project").
2. Click **New project**.
3. Project name: `Manuscript Desk`. Leave the rest as it is.
4. Click **Create**. Wait a few seconds, then make sure the picker at the top shows `Manuscript Desk`. If not, click the picker and choose it.

### Step 3. Turn on the Google Drive API
1. In the search bar at the top, type `Google Drive API` and click the result under "Marketplace" / "APIs".
2. Click **Enable**.

### Step 4. Set up the consent screen (who is allowed to sign in)
1. In the search bar, type `OAuth consent screen` and open it. (It may open a page called **Google Auth Platform**. That is correct.)
2. Click **Get started**.
3. **App information**: App name `Manuscript Desk`, User support email: your email. Click **Next**.
4. **Audience**: choose **External**. Click **Next**.
5. **Contact information**: your email. Click **Next**.
6. Tick the agreement box, click **Continue**, then **Create**.

### Step 5. Publish the app (important)
If you skip this, your key stops working after 7 days.

1. In the left menu of Google Auth Platform, click **Audience**.
2. Under "Publishing status" click **Publish app**, then **Confirm**.
3. The status should now say **In production**.

The app only asks for the `drive.file` permission (it can see only the files it creates itself), so Google does not need to review it.

### Step 6. Create the Client ID and Client Secret
1. In the left menu, click **Clients**.
2. Click **Create client**.
3. Application type: **Web application**. Name: `Manuscript Desk`.
4. Under **Authorized redirect URIs**, click **Add URI** and paste exactly:
   ```
   https://developers.google.com/oauthplayground
   ```
5. Click **Create**.
6. A box shows your **Client ID** and **Client secret**. Copy both into your text file now:
   - Client ID → `GOOGLE_CLIENT_ID` (ends with `.apps.googleusercontent.com`)
   - Client secret → `GOOGLE_CLIENT_SECRET` (starts with `GOCSPX-`)

   If the box closed before you copied the secret: click the client's name in the list, and under "Client secrets" click **Add secret**, then copy the new one.

### Step 7. Get the refresh token
1. Open <https://developers.google.com/oauthplayground> in a new tab.
2. Click the **gear icon** (top right).
3. Tick **Use your own OAuth credentials**.
4. Paste your Client ID and Client secret into the two boxes. Close the gear panel.
5. On the left, ignore the long list. At the bottom of that list there is a box that says **Input your own scopes**. Paste exactly:
   ```
   https://www.googleapis.com/auth/drive.file
   ```
6. Click **Authorize APIs**.
7. Choose your Google account. If Google shows "Google hasn't verified this app", click **Advanced**, then **Go to Manuscript Desk (unsafe)**. This warning appears because it's your own private app; it is safe.
8. Click **Continue** / **Allow**.
9. You are back in the Playground at "Step 2". Click **Exchange authorization code for tokens**.
10. Copy the **Refresh token** (starts with `1//`) into your text file as `GOOGLE_REFRESH_TOKEN`.

   If the Refresh token box is empty: open the gear again, make sure "Access type" is **Offline**, and repeat from step 6.

Part A is done. Treat these three values like passwords: never paste them into GitHub files.

---

## Part B: Put the code on GitHub

1. Unzip `research-manager.zip` on your computer. You get a folder named `research-manager`.
2. Go to <https://github.com/new>.
3. Repository name: `research-manager`. Choose **Private**. Do **not** tick "Add a README". Click **Create repository**.
4. On the next page, click the link **uploading an existing file**.
5. Open the `research-manager` folder on your computer, select **everything inside it** (Ctrl+A on Windows, Cmd+A on Mac), and drag it all onto the GitHub page. Use Chrome or Edge for this; they upload folders correctly.
6. Wait until every file has finished uploading, then click **Commit changes**.
7. Check: the repository's main page should show the folders `app`, `components`, `lib` and the files `package.json`, `README.md` and others. If `app` or `components` is missing, drag those folders in again the same way.

Hidden files such as `.gitignore` may not upload on a Mac. That's fine; the app doesn't need them on GitHub.

---

## Part C: Deploy on Vercel

1. Go to <https://vercel.com/signup> and choose **Continue with GitHub**. (If you already have Vercel, sign in.)
2. Click **Add New…** → **Project**.
3. Find `research-manager` in the list and click **Import**. If it isn't listed, click "Adjust GitHub App Permissions" and allow Vercel to see that repository.
4. On the "Configure Project" page, open **Environment Variables**. Add these six, one at a time (type the name on the left, paste the value on the right, click **Add**):

   | Key | Value |
   |---|---|
   | `GOOGLE_CLIENT_ID` | from Part A |
   | `GOOGLE_CLIENT_SECRET` | from Part A |
   | `GOOGLE_REFRESH_TOKEN` | from Part A |
   | `DRIVE_FOLDER_NAME` | `Research Manager Data` (or any name you like) |
   | `SESSION_SECRET` | a long random string, at least 32 characters. Use any password generator and make up your own; don't reuse an example from anywhere |
   | `SETUP_KEY` | a secret word only you know, e.g. `blue-mango-47` |

   Paste values without spaces or quotes around them.
5. Leave everything else as it is (Vercel detects Next.js by itself). Click **Deploy**.
6. Wait 1 to 2 minutes. When you see "Congratulations", click the preview to open your site. The address looks like `https://research-manager-xxxx.vercel.app`.

### Check the connection
Open `https://YOUR-SITE.vercel.app/api/health`. You should see `"ok":true`. If not, the `error` text tells you what's wrong. The most common fixes:

- `invalid_client`: the Client ID or secret was pasted wrongly.
- `invalid_grant`: the refresh token is wrong or expired. Make sure the app is **In production** (Part A, step 5) and get a new token (Part A, step 7).
- `sessionSecretPresent: false`: add `SESSION_SECRET`.

**After changing any variable in Vercel you must redeploy**: Vercel → your project → **Deployments** → the three dots next to the latest one → **Redeploy**.

---

## Part D: First sign-in

1. Open your site. It sends you to **Create the first account**.
2. Enter your `SETUP_KEY`, your name, a username (e.g. `ahmad`) and a password (8+ characters).
3. You're in. This first account is the **admin**.

To give co-authors access: **Settings → Create an account**, then send them the username and password. On any project, the owner can add them under **Who can edit**. Members only see projects they own or were added to; admins see everything.

---

## Where your data lives

The app creates a folder called whatever you set in `DRIVE_FOLDER_NAME` in your Google Drive, with four JSON files inside.

- You **can move** that folder anywhere in your Drive, for example into an existing "Research" folder. The app still finds it.
- **Don't rename it** (or change `DRIVE_FOLDER_NAME`), or the app starts a new, empty folder.
- **Don't create a folder with that name yourself.** The app can only use the folder it created.
- Google Drive keeps older versions of each file automatically: right-click a file → **File information** → **Manage versions**.
- **Settings → Download a backup** gives you everything in one JSON file.

---

## How to use it

**Projects.** Click **New project**. Title, abstract and keywords are all optional; every field on the project page has its own **Add / Edit** button so you can fill it in later.

**Authors.** On a project, type in the author box. You get a dropdown of similar names; typing an email that's already saved shows "Email match: add with all saved details". If nobody matches, choose **Add "…" as a new author**; they go into the directory automatically. Authors whose institutions have special requirements show a small **Has notes** tag, and before they're added you're shown the notes to check. Per paper you choose which affiliations to print, the order, corresponding author, equal contribution and CRediT roles. **Copy for the paper** builds the author block, a LaTeX (elsarticle) version, the email list, ORCIDs and a CRediT statement.

**Journals.** Save each journal's name, alias, ISSNs, quartiles, impact factor, links, APC and extra charges, and Word / LaTeX template links. The journal page calculates, from your own papers: time to first decision, submission → acceptance, acceptance → publication, total time, time to rejection and your acceptance rate.

**Journal history.** On a project, **New submission** records a journal and the submission date. **Add update** records what happened next (under review, revision requested, revision submitted, accepted, published, rejected, withdrawn). After a rejection or withdrawal, the paper shows on the dashboard as **Needs a new venue**; submit it to the next journal and the full history stays.

**Funding statement.** Add grants (funder, grant number, which authors received them). Untick "Print this grant" for funding that shouldn't appear in the paper. The statement text is ready to copy.

**Internal funding pool.** Private to project members. Record who put in how much, then payments out: APC, other expenses, or money paid back to particular authors. It shows the balance and each author's put-in / received / net. The **Funding** button on the dashboard opens the totals across all projects.

**Dashboard.** Counts per stage (click any number for the list), everything pending (papers needing a decision, plus open tasks with who they're waiting on), and paper counts per author.

---

## Updating the app later

Change a file on GitHub (open it, click the pencil icon, edit, **Commit changes**). Vercel redeploys automatically within a minute or two. Your data in Drive is not touched.

## Limits worth knowing

- Two people saving the *same section of the same project* at the same second: the later save wins. For a small research group this is rare.
- Every page reads the JSON files from Drive, so pages take about half a second to a second to load.
- Optional: to run it on your own computer, install Node.js 20+, then run `npm install` and `npm run dev` in the folder. Without Google keys it saves to a local `.data` folder and the setup key is `local`.

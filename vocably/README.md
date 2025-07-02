### Step 1: Create a New Repository on GitHub

1. **Log in to GitHub**: Go to [GitHub](https://github.com) and log in to your account.
  
2. **Create a New Repository**:
   - Click on the "+" icon in the upper right corner of the page.
   - Select "New repository" from the dropdown menu.

3. **Fill in Repository Details**:
   - **Repository Name**: Enter a name for your repository (e.g., `Vocably`).
   - **Description**: Optionally, add a description of your project.
   - **Public/Private**: Choose whether you want the repository to be public or private.
   - **Initialize this repository with**: You can leave this unchecked if you want to upload your existing project folder directly.
   - Click the "Create repository" button.

### Step 2: Upload Your Project Folder

You can upload your project folder using either the GitHub web interface or Git command line. Here’s how to do it using both methods:

#### Method 1: Using the GitHub Web Interface

1. **Go to Your Repository**: After creating the repository, you will be redirected to the new repository page.

2. **Upload Files**:
   - Click on the "Add file" button.
   - Select "Upload files".
   - Drag and drop your Vocably project folder or click "choose your files" to select the files from your computer.

3. **Commit Changes**:
   - After the files are uploaded, scroll down to the bottom of the page.
   - Add a commit message (e.g., "Initial upload of Vocably project").
   - Click the "Commit changes" button.

#### Method 2: Using Git Command Line

1. **Open Terminal/Command Prompt**: Navigate to the directory where your Vocably project folder is located.

2. **Initialize Git**:
   ```bash
   cd path/to/Vocably
   git init
   ```

3. **Add Remote Repository**:
   Replace `USERNAME` with your GitHub username and `REPOSITORY_NAME` with the name of your repository.
   ```bash
   git remote add origin https://github.com/USERNAME/REPOSITORY_NAME.git
   ```

4. **Add Files**:
   ```bash
   git add .
   ```

5. **Commit Changes**:
   ```bash
   git commit -m "Initial upload of Vocably project"
   ```

6. **Push to GitHub**:
   ```bash
   git push -u origin master
   ```

### Step 3: Verify Your Upload

1. **Check Your Repository**: Go back to your GitHub repository page and refresh it. You should see all the files from your Vocably project uploaded successfully.

### Additional Notes

- If your project folder is large, consider using `.gitignore` to exclude files that do not need to be uploaded (like build files, logs, etc.).
- Make sure you have Git installed on your machine if you are using the command line method. You can download it from [git-scm.com](https://git-scm.com/).

That's it! Your Vocably project should now be uploaded to GitHub.
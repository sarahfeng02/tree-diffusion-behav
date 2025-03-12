# About

This is the behavioral code for a jsPsych experiment collecting human behavioral data for a visual compositional inference task based on Schwartenbeck et al. 2023's work. This is for the Cognitive & Neural Computational Laboratory's compositional inference project at Yale University, supervised by Dr. Ilker Yildirim and Sylvia Blackmore. 

## About the task

In the training phase of this task, participants are shown silhouettes composed of 3 building blocks. They will then be shown images of 2 of the blocks and asked to respond about their relationship (1 of 5 options: on-top, below, left, right, or do not connect). These correspond to the up-arrow key, down-arrow key, left-arrow key, right-arrow key, and space bar. After the participant makes a response, the corresponding button lights up in green (for an accurate response) or red (for an inaccurate response). If they do not respond, they are shown a 1-second 'timeout screen.' There are 192 trials of training, in which they are shown one stimulus set, or 'graph.' This stimulus set contains 12 different silhouettes. They will be asked about relationships between different blocks inside the same silhouette in different ways. 

In the testing phase of this task, participants see 48 more trials of a new stimulus set. They are no longer shown feedback. 

Each silhouette is called a 'inference,' and each question regarding the two blocks is called an 'probe.' 

## Code structure

The `src/experiment.js` file contains the experiment code; the `styles/main.scss` file contains the CSS styling. All of the assets are located in a remote Box folder that must be downloaded. See below for notes on how to alter the assets directory variable to allow your machine to locate those files.

## Running the code

After downloading the repository:

1. Download the assets folder, `comp-inf-assets`, from Box.
2. Rename it `assets`.
3. Move it into your `tree-diffusion-behav` root directory.
5. On your terminal, use `cd` to get to the directory so that you are currently inside of `tree-diffusion-behav`.
6. Run `npm run build`.
7. Run `npm start`.
8. You can then access the experiment via the link that the terminal will give you on your browser.
9. The data will be saved to your local desktop.

   



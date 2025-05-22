# About

This is the behavioral code for a jsPsych experiment collecting human behavioral data for a visual compositional inference task based on Schwartenbeck et al. 2023's work. This is for the Cognitive & Neural Computational Laboratory's compositional inference project at Yale University, supervised by Dr. Ilker Yildirim and Sylvia Blackmore. 

## About the task

In the training phase of this task, participants are shown silhouettes composed of 3 building blocks. They will then be shown images of 2 of the blocks and asked to respond about their relationship (1 of 5 options: on-top, below, left, right, or do not connect). These correspond to the up-arrow key, down-arrow key, left-arrow key, right-arrow key, and space bar. After the participant makes a response, the corresponding button lights up in green (for an accurate response) or red (for an inaccurate response). If they do not respond, they are shown a 1-second 'timeout screen.' There are 192 trials of training, in which they are shown one stimulus set, or 'graph.' This stimulus set contains 12 different silhouettes. They will be asked about relationships between different blocks inside the same silhouette in different ways. 

In the testing phase of this task, participants see 48 more trials of the same stimulus set, but probing different sets of 2 blocks that were not previously seen before.

## Code structure

The `src/experiment.js` file contains the experiment code; the `styles/main.scss` file contains the CSS styling. The `assets` folder contains all necessary graphics. 

## Running the code locally

1. Download this repository.
2. On terminal, `cd` into the repository.
3. Download the assets folder from Box and place it inside this repository, naming it `assets`.
4. Run `npm run build` and `npm start`.

## Running the code from Vultr

1. Log into Vultr.
2. SSH into your server.
3. Make sure that the git remote repository URL is set to the appropriate repository (this one, or a different one if you forked and made edits) with ```git remote add origin <your-repo-URL>```.
4. Run ```git pull origin main```.
5. Run `npm run build` and `npm start`.

   



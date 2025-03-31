# About

This is the behavioral code for a jsPsych experiment collecting human behavioral data for a visual compositional inference task based on Schwartenbeck et al. 2023's work. This is for the Cognitive & Neural Computational Laboratory's compositional inference project at Yale University, supervised by Dr. Ilker Yildirim and Sylvia Blackmore. 

## About the task

In the training phase of this task, participants are shown silhouettes composed of 3 building blocks. They will then be shown images of 2 of the blocks and asked to respond about their relationship (1 of 5 options: on-top, below, left, right, or do not connect). These correspond to the up-arrow key, down-arrow key, left-arrow key, right-arrow key, and space bar. After the participant makes a response, the corresponding button lights up in green (for an accurate response) or red (for an inaccurate response). If they do not respond, they are shown a 1-second 'timeout screen.' There are 192 trials of training, in which they are shown one stimulus set, or 'graph.' This stimulus set contains 12 different silhouettes. They will be asked about relationships between different blocks inside the same silhouette in different ways. 

In the testing phase of this task, participants see 48 more trials of the same stimulus set, but probing different sets of 2 blocks that were not previously seen before.

## Code structure

The `src/experiment.js` file contains the experiment code; the `styles/main.scss` file contains the CSS styling. All of the assets are located in a remote Box folder that must be downloaded. See below for notes on how to alter the assets directory variable to allow your machine to locate those files.

All of the assets reside in https://yale.box.com/v/cncl-comp-inf-assets. 

## Running the code

1. Download this repository.
2. On terminal, `cd` into the repository.
3. Run the following command to make the start-up script executable: `chmod a+x startup.sh.`
4. Run `startup.sh.`

   



# About

This is the behavioral code for a jsPsych experiment collecting human behavioral data for a visual compositional inference task based on Schwartenbeck et al. 2023's work. This is for the Cognitive & Neural Computational Laboratory's compositional inference project at Yale University, supervised by Dr. Ilker Yildirim and Sylvia Blackmore. 

## About the task

In this task, participants are shown silhouettes composed of 3 building blocks. They will then be shown images of 2 of the blocks and asked to respond about their relationship (1 of 4 options: above, below, to the left of, or to the right of). 

The experiment begins with 192 trials of training, in which they are shown one stimulus set, or 'graph.' This stimulus set contains 12 different silhouettes. They will be asked about relationships between different blocks inside the same silhouette in different ways. They are then tested on 48 trials of a new stimulus set and then 48 trials of another new stimulus set. In total, there are 288 trials.

Each silhouette is called a 'inference,' and each question regarding the two blocks is called an 'inference.' 

## Using the code

In *assets/all_info*, each subject has their own folder, inside which is a CSV file containing information about their exact original trial structure from the 2023 experiment. This is to ensure that the ordering matches the original experiment. These were pulled from the Matlab files provided by Philip Schwartenbeck.

In *assets/graph...*, each graph (the stimuli sets) has their own inferences and all of the different probes. The code randomly selects a graph for the participant and randomly chooses subjects who had that graph in the original experiment and then mirrors the exact trial structure. It uses this to load the different inferences and probes in different orders.

In *src/experiment.js*, there is the actual experiment code.


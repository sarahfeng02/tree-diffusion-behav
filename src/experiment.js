/**
 * @title Compositional_Inference
 * @description This is a jsPsych experiment designed to collect human behavioral data on visual inference on silhouettes. This is based off of Schwartenbeck et al. 2023.
 * @version 0.1.1
 * @environment JavaScript
 *
 * @assets assets/
 */

// You can import stylesheets (.scss or .css).
import "../styles/main.scss";

import { JsPsych } from "jspsych";
import { initJsPsych } from "jspsych";
import FullscreenPlugin from "@jspsych/plugin-fullscreen";
import HtmlKeyboardResponsePlugin from "@jspsych/plugin-html-keyboard-response";
import PreloadPlugin from "@jspsych/plugin-preload";
import ImageKeyboardResponsePlugin from "@jspsych/plugin-image-keyboard-response";
import SurveyMultiChoicePlugin from "@jspsych/plugin-survey-multi-choice";
import ImageButtonResponsePlugin from "@jspsych/plugin-image-button-response";
import Papa from "papaparse";
import HtmlButtonFeedbackPlugin from './plugin/button-feedback.js';
import instructions from '@jspsych/plugin-instructions';

/**
 * This function will be executed by jsPsych Builder and is expected to run the jsPsych experiment
 *
 * @type {import("jspsych-builder").RunFunction}
 */

export async function run({ assetPaths, input = {}, environment, title, version }) {
  
  // Deifning constants
  var timeline = []; // Empty timeline
  const trial_dur = 6000; // Trial duration in milliseconds
  let currentDate = new Date(); // for file timestamp

  const csvUrl = "assets/block_relationships.csv";
  const imgBaseUrl = "assets";
  const imgPractice = ["assets/materials/stable.png",
                      "assets/materials/block1.png",
                      "assets/materials/block2.png",
                      "assets/materials/block3.png"]

  let blockRelationships = []; // Store parsed CSV data

  // Helper function to fetch and parse CSV
  async function loadCSV(url) {
      return fetch(url)
          .then(response => response.text())
          .then(text => Papa.parse(text, { header: true }).data)
          .catch(error => console.error("Error loading CSV:", error));
  }

  // Helper function to construct inference paths
  function constructInfPath(graph, stim) {
    return `${imgBaseUrl}/${graph}/inference/${stim}.png`;
  }
  
  // Helper function to construct probe paths
  function constructProbePath(graph, stim, block1, block2, relation) {
    let probeType = (block1 === "stable" || block2 === "stable") ? "training_probes" : "test_probes";
    return `${imgBaseUrl}/${graph}/${probeType}/${stim}/${block1}_${block2}_${relation}.png`;
  }

  // Helper function to find ground truth relationship
  function getGroundTruth(graph, block1, block2, stim) {
      let entry = blockRelationships.find(row =>
          row.graph === graph && row.block_ID_1 === block1 && row.block_ID_2 === block2 && row.stimulus == stim
      );
      return entry ? entry.relationship : null;
  }

  // Select two random graphs from available graphs in CSV
  function selectRandomGraphs() {
      let graphs = [...new Set(blockRelationships.map(row => row.graph))];
      let shuffled = graphs.sort(() => Math.random() - 0.5);
      return { practiceGraph: shuffled[0], trainGraph: shuffled[1] };
  }

  // Load CSV data
  blockRelationships = await loadCSV(csvUrl);
  blockRelationships = blockRelationships.map(row => {
    let newRow = { ...row }; // Create a shallow copy to avoid modifying the original object
    if ('month' in newRow) {  // Check if 'month' exists in the object
        newRow.stimulus = newRow.month; // Rename 'month' to 'stimulus'
        delete newRow.month; // Remove the old key
    }
    return newRow;
  });
  const { practiceGraph, trainGraph } = selectRandomGraphs();
  const stimuli = [...Array(12).keys()].map(i => i + 1); // Stimuli numbers 1-12

  // **Setup Practice Graph**
  let practiceSession = [];
  let practiceStimuli = stimuli.sort(() => Math.random() - 0.5).slice(0, 3);
  for (let stim of practiceStimuli) {
      let row = blockRelationships.find(r => r.graph === practiceGraph && r.stimulus == stim);
      if (row) {
          let trial = {
              inference: constructInfPath(practiceGraph, stim),
              probe: constructProbePath(practiceGraph, stim, row.block_ID_1, row.block_ID_2, row.relationship),
              correct_relation: row.relationship,
              trialType: "practice"
          };
          practiceSession.push(trial);
      }
  }

  // **Setup Train Graph (4 training sessions)**
  let trainSession = [];
  for (let session = 1; session <= 4; session++) {
      for (let stim of stimuli) {
          let rows = blockRelationships.filter(r => 
            r.graph === trainGraph && 
            r.stimulus == stim && 
            (r.block_ID_1 === "stable" || r.block_ID_2 === "stable") // Only choose training probes
          ); 
          let shuffledRows = rows.sort(() => Math.random() - 0.5);
          let selectedRows = shuffledRows.slice(0, 4); // Pick 4 variations
          for (let row of selectedRows) {
              let trial = {
                  inference: constructInfPath(trainGraph, stim),
                  probe: constructProbePath(trainGraph, stim, row.block_ID_1, row.block_ID_2, row.relationship),
                  correct_relation: row.relationship,
                  trialType: "training"
              };
              trainSession.push(trial);
          }
      }
  }

  // **Setup Test Session**
  let testSession = [];
  for (let stim of stimuli) {
      let rows = blockRelationships.filter(r => 
        r.graph === trainGraph && 
        r.stimulus == stim && 
        r.block_ID_1 !== "stable" && 
        r.block_ID_2 !== "stable" // Only choose training probes
      );
      let shuffledRows = rows.sort(() => Math.random() - 0.5);
      let selectedRows = shuffledRows.slice(0, 2); // Each test probe appears twice
      for (let row of selectedRows) {
          let trial = {
              inference: constructInfPath(trainGraph, stim),
              probe: constructProbePath(trainGraph, stim, row.block_ID_1, row.block_ID_2, row.relationship),
              correct_relation: row.relationship,
              trialType: "testing"
          };
          testSession.push(trial);
      }
  }

  console.log("Experiment setup complete!");

  // Initialize the experiment

  var jsPsych = initJsPsych({
    timeline: timeline,
    show_progress_bar: true,
    default_iti: 500,
    minimum_valid_rt: 50,
    override_safe_mode: true,
    use_webaudio: false,
    on_finish: function() {
      var file_name = `${currentDate}_${rand_subject_id}_data.csv`;
      jsPsych.data.get().localSave('csv',file_name);
    },
  }); 

  // Define global experiment properties
  jsPsych.data.addProperties({
    experimentVersion: version,
    practiceGraph: practiceGraph,
    trainingtestingGraph: trainGraph,
  });
  var rand_subject_id = jsPsych.randomization.randomID(8); // generate a random subject ID that contains 8 alphanumeric characters
  jsPsych.data.addProperties({ID: rand_subject_id});
  
  // Preload assets
  timeline.push({
    type: PreloadPlugin,
    images: assetPaths.images,
    audio: assetPaths.audio,
    video: assetPaths.video
  }); 


  // Defining task components

  // Inference trial 
  var infTrial = {
    type: ImageKeyboardResponsePlugin,
    stimulus: jsPsych.timelineVariable('inference'),
    stimulus_height: 600,
    stimulus_width: 600,
    trial_duration: trial_dur,
    choices: "NO_KEYS",
    data: {
        type: 'inference'
    },
  };

  // Probe trial
  
  var probeTrial = {
    type: HtmlButtonFeedbackPlugin,
    stimulus: function() {
      return jsPsych.timelineVariable('probe');
    },
    correct_relation: jsPsych.timelineVariable('correct_relation'),
    trial_duration: 6000,
    feedback_duration: 1000,
    on_finish: function(data) {
      console.log('data from trial ', data)
      data.timeout = !data.response_made
    }
  };

  // Timeout screen

  var timeout = {
    type: HtmlKeyboardResponsePlugin,
    stimulus: "<p style='font-size: 24px; color: red;'>Time-out</p>",
    choices: "NO_KEYS",
    trial_duration: 1000
  };

  var probeTrialFeedback = {
    timeline: [timeout],
    conditional_function: function() {
      var lastTrialData = jsPsych.data.get().last(1).values()[0];
      return lastTrialData.timeout == true;
    }
  };

  // Start of script! 

  // Welcome screen
  timeline.push({
    type: instructions,
    pages: [      
      'Welcome to the experiment.<br>First, we are going to ask you some demographics questions.',      
      ],        
      show_clickable_nav: true     
  });
   
  // Demographics
  timeline.push({
    type: SurveyMultiChoicePlugin,
    data: {demographics: "demographics"}, // storing data in demographics category
    questions: [
        { 
            prompt: "What is your age group?",
            name: "age_q",
            options: ['18-20', '21-23', '24-26', '27-29',
                '29-31', '32-34', '35-37', '38-40', '41-43',
                '43-45'
            ],
            required: true
        },
        {
            prompt: "What is your sex?",
            name: "sex_q",
            options: ['female', 'male', 'other', 'prefer not to answer'],
            required: true
        }
    ],
  });

  // Switch to fullscreen
  timeline.push({
    type: FullscreenPlugin,
    fullscreen_mode: true,
  });

  timeline.push({
    type: instructions,
    pages: [
        'In this experiment, you will be inferring the underlying structure behind a silhouette.<br>' + 
        'You will first be shown a silhouette made up of 3 building blocks for 6 seconds.',
        'The 3 blocks that make up the silhouette will be taken from the 4 options below:<br><br>' +
        '<div style="display: flex; justify-content: center; gap: 20px; margin-top: 20px;">' +
        `<img src=${imgPractice[0]} alt="Block 4" width="90" height="30">` +
        `<img src=${imgPractice[1]} alt="Block 1" width="50" height="50">` +
        `<img src=${imgPractice[2]} alt="Block 2" width="50" height="50">` +
        `<img src=${imgPractice[3]} alt="Block 3" width="30" height="90"></div>`, 
        'Each block will be above, below, to the left of, to the right of, or not connecting with each other block.<br>' +
        'As you look at the silhouette, try to imagine each of these relationships.', 
        'You will then be asked about 2 of the 3 blocks shown in the silhouette, and asked to select the relationship between them.<br>',
        'You must answer <strong>with respect to the left block.</strong><br>',
        'You will have <strong>6 seconds</strong> to look at the silhouette and <strong>6 seconds</strong> to answer the question about the 2 blocks.<br>' +
        'Please try to make your best guess within the allotted time frame, even if you are not sure.<br>' +
        'We will first start with a few practice rounds.'
      ],
      show_clickable_nav: true      
    });
  
  // Practice procedure
  var practice_procedure = {
    timeline: [infTrial, probeTrial, probeTrialFeedback],
    timeline_variables: practiceSession,
  };
  timeline.push(practice_procedure);

  // Practice transition
  timeline.push({
    type: instructions,
    pages: [
      'You have now completed the practice.<br>' +
      'Remember to answer with respect to the block on the left.<br>' +
      'Click below to begin the experiment.'
    ],
    show_clickable_nav: true,
    });

  // Training session

  var train_procedure = {
    timeline: [infTrial, probeTrial, probeTrialFeedback],
    timeline_variables: trainSession,
  };
  timeline.push(train_procedure);

  // Training transition
    timeline.push({
      type: instructions,
      pages: [
        'You have now completed the first part of the experiment.<br>' +
        'In the next part, you will no longer be shown any feedback.<br>' +
        'Please try to make your best guess within the time frame of 6 seconds.<br>' +
        'Press any key to proceed.'
      ],
      show_clickable_nav: true,
      });
  
  // Testing procedure
  var test_procedure = {
    timeline: [infTrial, probeTrial],
    timeline_variables: testSession,
  };
  timeline.push(test_procedure);

  // Testing transition
  timeline.push({
    type: instructions,
    pages: [
      'You have now completed the experiment.<br>' +
      'Thank you for contributing to our science.<br>' +
      'Your data will help us understand human cognition and memory.'
    ],
    show_clickable_nav: true,
    });

  // Run the experiment
  jsPsych.run(timeline);
  return jsPsych;

}

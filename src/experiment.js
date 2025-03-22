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

/**
 * This function will be executed by jsPsych Builder and is expected to run the jsPsych experiment
 *
 * @type {import("jspsych-builder").RunFunction}
 */

export async function run({ assetPaths, input = {}, environment, title, version }) {
  
  // Deifning constants
  var timeline = []; // Empty timeline
  const trial_dur = 6000; // Trial duration in milliseconds
  var rand_subject_id = jsPsych.randomization.randomID(8); // generate a random subject ID that contains 8 alphanumeric characters
  let currentDate = new Date(); // for file timestamp

  const csvUrl = "https://yale.box.com/v/cncl-comp-inf-assets/block_relationships.csv";
  const imgBaseUrl = "https://yale.box.com/v/cncl-comp-inf-assets";
  const imgPractice = ["https://yale.box.com/shared/static/stable.png",
                      "https://yale.box.com/shared/static/block1.png",
                      "https://yale.box.com/shared/static/block2.png",
                      "https://yale.box.com/shared/static/block3.png"]

  let blockRelationships = []; // Store parsed CSV data
  let allImages = new Set(); // Store unique image file paths
  imgPractice.forEach(img => allImages.add(img)); // Add the images of the individual blocks

  // Helper function to fetch and parse CSV
  async function loadCSV(url) {
      return fetch(url)
          .then(response => response.text())
          .then(text => Papa.parse(text, { header: true }).data)
          .catch(error => console.error("Error loading CSV:", error));
  }

  // Helper function to construct file paths
  function constructFilePath(graph, stim, block1, block2, relation) {
      let probeType = relation === "stable" ? "training_probes" : "test_probes";
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
  const { practiceGraph, trainGraph } = selectRandomGraphs();
  const stimuli = [...Array(12).keys()].map(i => i + 1); // Stimuli numbers 1-12

  // **Setup Practice Graph**
  let practiceSession = [];
  let practiceStimuli = stimuli.sort(() => Math.random() - 0.5).slice(0, 3);
  for (let stim of practiceStimuli) {
      let row = blockRelationships.find(r => r.graph === practiceGraph && r.stimulus == stim);
      if (row) {
          let trial = {
              inference: constructFilePath(practiceGraph, stim, row.block_ID_1, row.block_ID_2, row.relationship),
              probe: constructFilePath(practiceGraph, stim, row.block_ID_1, row.block_ID_2, row.relationship),
              correct_relation: row.relationship,
              trialType: "practice"
          };
          allImages.add(trial.inference);
          allImages.add(trial.probe);
          practiceSession.push(trial);
      }
  }

  // **Setup Train Graph (4 training sessions)**
  for (let session = 1; session <= 4; session++) {
      let trainSession = [];
      for (let stim of stimuli) {
          let rows = blockRelationships.filter(r => r.graph === trainGraph && r.stimulus == stim);
          let shuffledRows = rows.sort(() => Math.random() - 0.5);
          let selectedRows = shuffledRows.slice(0, 4); // Pick 4 variations
          for (let row of selectedRows) {
              let trial = {
                  inference: constructFilePath(trainGraph, stim, row.block_ID_1, row.block_ID_2, row.relationship),
                  probe: constructFilePath(trainGraph, stim, row.block_ID_1, row.block_ID_2, row.relationship),
                  correct_relation: row.relationship,
                  trialType: "training"
              };
              allImages.add(trial.inference);
              allImages.add(trial.probe);
              trainSession.push(trial);
          }
      }
  }

  // **Setup Test Session**
  let testSession = [];
  for (let stim of stimuli) {
      let rows = blockRelationships.filter(r => r.graph === practiceGraph && r.stimulus == stim);
      let shuffledRows = rows.sort(() => Math.random() - 0.5);
      let selectedRows = shuffledRows.slice(0, 2); // Each test probe appears twice
      for (let row of selectedRows) {
          let trial = {
              inference: constructFilePath(practiceGraph, stim, row.block_ID_1, row.block_ID_2, row.relationship),
              probe: constructFilePath(practiceGraph, stim, row.block_ID_1, row.block_ID_2, row.relationship),
              correct_relation: row.relationship,
              trialType: "testing"
          };
          allImages.add(trial.inference);
          allImages.add(trial.probe);
          testSession.push(trial);
      }
  }

  // **Preload all images**
  jsPsych.pluginAPI.preloadImages(Array.from(allImages));

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
    ID: rand_subject_id
  });

  // Preload assets
  timeline.push({
    type: PreloadPlugin,
    images: [...assetPaths.images, ...Array.from(allImages)], // Include dynamically generated image paths
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
    type: HtmlKeyboardResponsePlugin,
    stimulus: "<p>Welcome to the experiment! Press any key to begin.<p/>",
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
    on_finish: function(data) {
      // Save additional demographic data  
      jsPsych.data.addProperties({
          age_group: data.responses.age_q,
          sex: data.responses.sex_q
      });
    }
  });

  // Practice instructions
  timeline.push({
    type: HtmlKeyboardResponsePlugin,
    stimulus: `
        <p><strong>Welcome to the experiment.</strong></p>
        <p>In this experiment, you will be asked to infer the underlying structure behind a silhouette.</p>
        <p>The silhouette will be made up of 3 of the 4 shapes below.</p>
        <p>They will be in any relation to one another: above, below, to the left of, to the right of, or not connected to each other.</p>
        <p>You will then be shown 2 of the 3 blocks in the image and asked to select the relationship <b> with respect to the block in the top left </b>.</p> 
        <p><em>In the question screen, you will be shown 2 blocks. It is very important that you remember to answer with respect to the left block.</em></p>
        <p>We will first start with a few practice rounds.</p>
        <p>Press any key to try it out.</p>

         <div style="display: flex; justify-content: center; gap: 20px; margin-top: 20px;">
          <img src=imgPractice[0] alt="Block 4" width="100">
          <img src=imgPractice[1] alt="Block 1" width="100">
          <img src=imgPractice[2] alt="Block 2" width="100">
          <img src=imgPractice[3] alt="Block 3" width="100">
        </div>
    `,
    });
  
  // Practice procedure
  var practice_procedure = {
    timeline: [infTrial, probeTrial, probeTrialFeedback],
    timeline_variables: practiceSession,
  };
  timeline.push(practice_procedure);

  // Practice transition
  timeline.push({
    type: HtmlKeyboardResponsePlugin,
    stimulus: `
        <p>You have now completed the practice. Please remember that:</p>
        <p><strong>1. You are trying to infer which blocks make up the silhouette and what relations they are in.</strong></p>
        <p><strong>2. When asked about 2 blocks, you are answering with respect to the left block.</strong></p>
        <p><strong>3. You have 6 seconds to look at the silhouette and 6 seconds to respond to the question.</strong></p>
        <p>i.e. is the center block above, below, to the right of, to the left of, or not-connecting with the left block?</p>
        <p>For this part of the experiment, you will be given feedback to know if you are right or wrong. Try to always make your best guess, even if you do not know.</p>
        <p>Press any key to begin the experiment.</p>
    `,
    });

  // Training session

  // Switch to fullscreen
  timeline.push({
    type: FullscreenPlugin,
    fullscreen_mode: true,
  });

  var train_procedure = {
    timeline: [infTrial, probeTrial, probeTrialFeedback],
    timeline_variables: trainSession,
  };
  timeline.push(train_procedure);

  // Training transition
  timeline.push({
    type: HtmlKeyboardResponsePlugin,
    stimulus: `
        <p>You have now completed the first part of the experiment.</p>
        <p>In the following part of the experiment, you will be completing the same task.</p>
        <p>However, you will not be shown any feedback.</p>
        <p><strong>Please try your best to answer within the time frame of 6 seconds, even if you do not know.</strong></p>
        <p>Press any key to continue.</p>
    `,
    });

  var test_procedure = {
    timeline: [infTrial, probeTrial],
    timeline_variables: testSession,
  };
  timeline.push(test_procedure);

  // Testing transition
  timeline.push({
    type: HtmlKeyboardResponsePlugin,
    stimulus: `
        <p>You have now completed the experiment!</p>
        <p>Thank you for contributing to our science. Your data will help us understand human cognition and memory.</p>
    `,
    });

  // Run the experiment
  jsPsych.run(timeline);
  return jsPsych;

}

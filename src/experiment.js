/**
 * @title Compositional_Inference_Behavioral
 * @description This is a jsPsych experiment designed to collect human behavioral data on visual inference on silhouettes. This is based off of Schwartenbeck et al. 2023.
 * @version 0.1.0
 *
 * @assets assets/
 */


// Make sure you downloaded the 'comp-inf-assets' folder, renamed it to 'assets', and moved it inside 'tree-diffusion-behav'! 
// Otherwise this code will not work.

// You can import stylesheets (.scss or .css).
import "../styles/main.scss";

import FullscreenPlugin from "@jspsych/plugin-fullscreen";
import HtmlKeyboardResponsePlugin from "@jspsych/plugin-html-keyboard-response";
import PreloadPlugin from "@jspsych/plugin-preload";
import { initJsPsych } from "jspsych";
import ImageKeyboardResponsePlugin from "@jspsych/plugin-image-keyboard-response";
import SurveyMultiChoicePlugin from "@jspsych/plugin-survey-multi-choice";
import ImageButtonResponsePlugin from "@jspsych/plugin-image-button-response";
import Papa from "papaparse";

/**
 * This function will be executed by jsPsych Builder and is expected to run the jsPsych experiment
 *
 * @type {import("jspsych-builder").RunFunction}
 */

async function loadcsv(csvpath) {
  const response = await fetch(csvpath);
  const csvtext = await response.text();

  return new Promise((resolve) => {
    Papa.parse(csvtext, {
      header: true,
      dynamicTyping: true,
      complete: function (results)
        {
          resolve(results.data);
        }    
      });
  });
}

export async function run({ assetPaths, input = {}, environment, title, version }) {
  // Helper functions

  /* 
  function shuffle(list) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
  */

  function rel_id(action) {
    if (action == 'ArrowLeft') {
      return 1;
    } else if (action == 'ArrowUp') {
      return 2;
    } else if (action == 'ArrowRight') {
      return 3;
    } else if (action == 'ArrowDown') {
      return 4;
    } else {
      return 5;
    }
  }
  
  // Initialize, load stimuli

  const session_length = 48;
  const train_length = 4 * session_length;
  const test_length = session_length; // used separately for each test set (so total test is 2 * test_length)
  const trial_dur = 6000;
  const meg_train = [];
  const meg_test = [];
  const graphs = [1, 2, 3, 4];

  // Initialize

  var jsPsych = initJsPsych({
    timeline: timeline,
    show_progress_bar: true,
    default_iti: 500,
    minimum_valid_rt: 50,
    override_safe_mode: true,
    use_webaudio: false,
    on_finish: function() {
      var file_name = rand_subject_id + '_data.csv';
      jsPsych.data.get().localSave('csv',file_name);
    },
  }); 

  // generate a random subject ID that contains 8 alphanumeric characters
  var rand_subject_id = jsPsych.randomization.randomID(8);
  // add the ID to the data for all trials
  jsPsych.data.addProperties({ID: rand_subject_id});

  var timeline = [];

  // Preload assets
  timeline.push({
    type: PreloadPlugin,
    images: assetPaths.images,
    audio: assetPaths.audio,
    video: assetPaths.video
  }); 

  // Stimuli  

  // Load the subjects

  var options = [];

  function get_sub(graph) {
    if (graph == 1) {
      options.push('s03', 's04', 's11', 's12', 's20'); 
    } else if (graph == 2) {
      options.push('s05', 's13', 's14', 's15', 's21');
    } else if (graph == 3) {
      options.push('s07', 's08', 's16', 's17', 's22');
    } else {
      options.push('s09', 's10', 's18', 's19', 's23');
    }

    var subject = options[Math.floor(Math.random() * options.length)];

    return subject;

    }

    // MEG training

    const graph_train = graphs[Math.floor(Math.random() * graphs.length)];
    const sub_train = get_sub(graph_train);
    const sub_train_path = `assets/all_info/${sub_train}/${sub_train}_info.csv`;
    const sub_train_csv = await loadcsv(sub_train_path);
    const order_train = sub_train_csv.map(row => row["order"]);
    const relation_train = sub_train_csv.map(row => row["relation"]);

    jsPsych.data.addProperties({
      training_graph: graph_train
    });

    for (let i = 0; i < train_length; i++) {
      meg_train.push({
        trial: i,
        inference: `assets/graph${graph_train}/inference/${order_train[i]}.png`,
        probe: `assets/graph${graph_train}/probe/${sub_train}/${i+1}.png`,
        inference: `assets/graph${graph_train}/inference/${order_train[i]}.png`,
        probe: `assets/graph${graph_train}/probe/${sub_train}/${i+1}.png`,
        correct_response: relation_train[i]
      });
    }

    // MEG testing

    // Test #1

    const graph_test_options = graphs.filter(item => item !== graph_train); 
    const graph_test1 = graph_test_options[Math.floor(Math.random() * graph_test_options.length)];
    const sub_test1 = get_sub(graph_test1);
    const sub_test1_path = `assets/all_info/${sub_test1}/${sub_test1}_info.csv`;
    const sub_test1_csv = await loadcsv(sub_test1_path);
    const order_test1 = sub_test1_csv.map(row => row["order"]);
    const relation_test1 = sub_test1_csv.map(row => row["relation"]);

    jsPsych.data.addProperties({
      testing_graph1: graph_test1
    });

    for (let i = 0; i < test_length; i++) {
      meg_test.push({
        trial: train_length + i,
        inference: `assets/graph${graph_test1}/inference/${order_test1[i]}.png`,
        probe: `assets/graph${graph_test1}/probe/${sub_test1}/${i+1}.png`,
        correct_response: relation_test1[i]
      })
    }

    /* 

    // Test #2

    const graph_test_options_small = graph_test_options.filter(item => item !== graph_test1);
    const graph_test2 = graph_test_options_small[Math.floor(Math.random() * graph_test_options_small.length)];
    const sub_test2 = get_sub(graph_test2);
    const sub_test2_path = `assets/all_info/${sub_test2}/${sub_test2}_info.csv`;
    const sub_test2_csv = await loadcsv(sub_test2_path);
    const order_test2 = sub_test2_csv.map(row => row["order"]);
    const relation_test2 = sub_test2_csv.map(row => row["relation"]);

    jsPsych.data.addProperties({
      testing_graph2: graph_test2
    });

    for (let i = 0; i < test_length; i++) {
      meg_test.push({
        trial: train_length + test_length + i,
        inference: `assets/graph${graph_test2}/inference/${order_test2[i]}.png`,
        probe: `assets/graph${graph_test2}/probe/${sub_test2}/${i+1}.png`,
        correct_response: relation_test2[i]
      })
    }

    */

  // Start of script! 

  // Welcome screen
  timeline.push({
    type: HtmlKeyboardResponsePlugin,
    stimulus: "<p>Welcome to the experiment! Press any key to begin.<p/>",
  });
   
  // Demographics
  timeline.push({
    // type: jsPsychSurveyMultiChoice,
    type: SurveyMultiChoicePlugin,
    data: {demographics: "demographics"},
    questions: [
        { 
            prompt: "What is your age group?",
            name: "Demographics_1",
            options: ['18-20', '21-23', '24-26', '27-29',
                '29-31', '32-34', '35-37', '38-40', '41-43',
                '43-45'
            ],
            required: true
        },
        {
            prompt: "What is your sex?",
            name: "Demographics_2",
            options: ['female', 'male', 'other', 'prefer not to answer'],
            required: true
        }
    ],
  });

  // Instructions
  timeline.push({
    type: HtmlKeyboardResponsePlugin,
    stimulus: `
        <p><strong>Training phase:</strong></p>
        <p>In this phase, a silhouette will appear in the center of the screen for 6 seconds.</p>
        <p>You'll then have 6 seconds to answer a question about the relationship between the two blocks.</p>
        <p>The questions will always ask about the left block in relation to the middle block. 'Did not connect' is also an option.</p>
        <p>Press any key to continue.</p>
    `,
    });

  // Start of task!

  // Switch to fullscreen
  timeline.push({
    type: FullscreenPlugin,
    fullscreen_mode: true,
  });

  // Inference trial 
  var infTrial = {
    type: ImageKeyboardResponsePlugin,
    stimulus: jsPsych.timelineVariable('inference'),
    stimulus_height: 600,
    stimulus_width: 600,
    trial_duration: trial_dur,
    choices: "NO_KEYS",
    data: {
        type: 'inference',
        trial: jsPsych.timelineVariable('trial'),
    },
  };

  // Probe trial
      
  var probeTrial = {
    type: HtmlKeyboardResponsePlugin,
    stimulus: function() {
      let probe = jsPsych.timelineVariable('probe');

      return `
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${probe}" alt="probe stimulus" style="max-width: 600px; max-height: 600px;">
        </div>

        <div style="display: flex; justify-content: center; gap: 10px;">
          <button id="btn-up" class="response-btn">On-top</button>
        </div>

        <div style="display: flex; justify-content: center; gap: 10px; margin-top: 10px;">
          <button id="btn-left" class="response-btn">Left</button>
          <button id="btn-right"class="response-btn">Right</button>
        </div>

        <div style="display: flex; justify-content: center; gap: 10px; margin-top: 10px;">
          <button id="btn-down" class="response-btn">Below</button>
        </div>

        <div style="display: flex; justify-content: center; gap: 30px; margin-top: 10px;">
          <button id="dnc" class="response-btn">Did not connect</button>
        </div>
      `;
    },
    trial_duration: trial_dur,
    response_ends_trial: false,
    choices: ['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp', ' '],
    data: {
        type: 'probe',
        trial: jsPsych.timelineVariable('trial'),
        correct_response: jsPsych.timelineVariable('correct_response'),
    },

    on_finish: function(data) {
      console.log('on finish');

      let keyMapping = {
        "arrowup": "btn-up",
        "arrowleft": "btn-left",
        "arrowright": "btn-right",
        "arrowdown": "btn-down",
        " ": "dnc",
      };

      if (data.response == null) {
        console.log('no choice made');

        data.correct = false;
        data.timeout = true;
      } else {
        console.log('response made: ', data.response);
        console.log('mapped button id: ', keyMapping[data.response]);

        data.timeout = false;

        setTimeout(function() {
          var selectedButton = document.getElementById(keyMapping[data.response]);
          console.log('selected button: ', selectedButton);
          console.log('data correct response: ', data.correct_response);
          if (selectedButton) {
            let isCorrect = jsPsych.pluginAPI.compareKeys(rel_id(data.response), data.correct_response);
            selectedButton.style.backgroundColor = isCorrect ? 'green' : 'red';
            data.correct = isCorrect; 
            if (isCorrect) {
              console.log('correct choice!');
            } else {
              console.log('incorrect choice!');
            }}
          }, 100);

          jsPsych.pluginAPI.setTimeout(function() {
            jsPsych.finishTrial(data);
          },1000);
      }
    },
    post_trial_gap: 1000,
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

  // Main procedure

  var train_procedure = {
    timeline: [infTrial, probeTrial, probeTrialFeedback],
    timeline_variables: meg_train,
  };

  var test_procedure = {
    timeline: [infTrial, probeTrial],
    timeline_variables: meg_test,
  };

  timeline.push(train_procedure);
  timeline.push(test_procedure);

  // Run the experiment

  // await jsPsych.run(timeline);
  jsPsych.run(timeline);

  // Return the jsPsych instance so jsPsych Builder can access the experiment results (remove this
  // if you handle results yourself, be it here or in `on_finish()`)

  return jsPsych;

}

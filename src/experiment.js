/**
 * @title Compositional_Inference
 * @description This is a jsPsych experiment designed to collect human behavioral data on visual inference on silhouettes. This is based off of Schwartenbeck et al. 2023.
 * @version 0.1.4
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
  const imgBlock = ["assets/materials/stable.png",
                      "assets/materials/block1.png",
                      "assets/materials/block2.png",
                      "assets/materials/block3.png"]
  const instructionsColor = ["assets/instructions/instruction1_color.png",
                            "assets/instructions/instruction2_color.png",
                            "assets/instructions/instruction3_color.png"]
  const instructionsSilhouette = ["assets/instructions/instruction1_silhouette.png",
                              "assets/instructions/instruction2_silhouette.png",
                              "assets/instructions/instruction3_silhouette.png"]
  const instructionsQuestion = ["assets/instructions/instruction2_question.png",
                                "assets/instructions/instruction2_buttons.png",
                                "assets/instructions/instruction1_question.png"]                

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
    let graphs = [...new Set(
      blockRelationships
        .map(row => row.graph)
        .filter(graph => graph !== undefined && graph !== null && graph !== '')
    )];
  
    if (graphs.length < 2) {
      throw new Error("Not enough valid graphs found: " + JSON.stringify(graphs));
    }
  
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
  let practiceStimuli = stimuli.sort(() => Math.random() - 0.5).slice(0, 10);
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
  let trainTrials = [];

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
              trainTrials.push(trial);
          }
      }
  }

  // 🔀 Global shuffle after all trials are collected
  let trainSession = trainTrials.sort(() => Math.random() - 0.5);

  // **Setup Test Session**
  let testTrials = [];

  for (let stim of stimuli) {
      let rows = blockRelationships.filter(r => 
          r.graph === trainGraph && 
          r.stimulus == stim && 
          r.block_ID_1 !== "stable" && 
          r.block_ID_2 !== "stable" // Only choose testing probes (non-stable)
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
          testTrials.push(trial);
      }
  }

  // 🔀 Global shuffle after all test trials are created
  let testSession = testTrials.sort(() => Math.random() - 0.5);

  console.log("Experiment setup complete!");

  // Initialize the experiment

  var jsPsych = initJsPsych({
    timeline: timeline,
    show_progress_bar: true,
    default_iti: 500,
    minimum_valid_rt: 50,
    override_safe_mode: true,
    use_webaudio: false,
    // save to JATOS
    on_finish: () => {
      if (typeof jatos !== 'undefined') {
          // in jatos environment
          jatos.endStudyAndRedirect(PROLIFIC_URL, jsPsych.data.get().json());
      } else {
          return jsPsych;
      };
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
    trial_duration: 1000000,
    feedback_duration: 1000,
    on_finish: function(data) {
      console.log('data from trial ', data)
      data.timeout = !data.response_made
    }
  };

  // Start of script! 

  // Welcome screen
  timeline.push({
    type: instructions,
    pages: [      
      'Welcome to the experiment.',      
      ],        
      show_clickable_nav: true     
  });

  // IRB approval
  timeline.push({
    type: instructions,
    pages: [
        `<h1>Psychology Experiment</h1>
        <h2>Informed Consent Form</h2>
        <hr />
        <div class="legal well">
            <p><b>Purpose:</b> We are conducting research on how we make inferences about the structures underlying our visual environments.</p>
            <p><b>Brief description:</b> In this experiment, you will make judgments about the relationships of blocks inside silhouettes. In total, we think making these judgments will take less than 50 minutes to complete.</p>
            <p><b>Procedures:</b> For each judgment, you will see an image of a silhouette, and your job is to make judgments about the relationships between the blocks that make up that silhouette.</p>
            <p><b>Risks and Benefits:</b> Completing this task poses no more risk of harm to you than do the experiences of everyday life (e.g., from working on a computer). Although this study will not benefit you personally, we hope it will contribute to the advancement of our understanding of the human mind.</p>
            <p><b>Confidentiality:</b> All of the responses you provide during this study will be anonymous. You will not be asked to provide any identifying information, such as your name, in any of the questionnaires. Typically, only the researchers involved in this study and those responsible for research oversight will have access to the information you provide. However, we may also share the data with other researchers so that they can check the accuracy of our conclusions; this will not impact you because the data are anonymous.</p>
            <p>The researcher will not know your name, and no identifying information will be connected to your survey answers in any way. However, your account is associated with a Prolific number that the researcher has to be able to see in order to pay you, and in some cases these numbers are associated with public profiles which could, in theory, be searched. For this reason, though the researcher will not be looking at anyone’s public profiles, the fact of your participation in the research (as opposed to your actual survey responses) is technically considered “confidential” rather than truly anonymous.</p>
            <p><b>Voluntary Participation:</b> Your participation in this study is voluntary. You are free to decline to participate, to end your participation at any time for any reason, or to refuse to answer any individual question.</p>
            <p><b>Questions:</b> If you have any questions about this study, you may contact Ilker Yildirim at ilker.yildirim@yale.edu. If you would like to talk with someone other than the researchers to discuss problems or concerns, to discuss situations in the event that a member of the research team is not available, or to discuss your rights as a research participant, you may contact, and mention HSC number 2000025930:</p>
            <center>
                <dl>
                    <dd> Yale University Human Subjects Committee</dd>
                    <dd> Box 208010, New Haven, CT 06520-8010</dd>
                    <dd> (203) 785-4688; human.subjects@yale.edu</dd>
                </dl>
            </center>
            <p>Additional information is available <a href="https://your.yale.edu/research-support/human-research/research-participants" target="_blank">here</a>.</p>
            <p><b>Agreement to participate:</b> By clicking the "Begin" button below, you acknowledge that you have read the above information and agree to participate in the study. You must be at least 18 years of age to participate; agreeing to participate confirms you are 18 years of age or older.</p>
            <center>
                <p><input type="checkbox" id="consent_checkbox"/> I agree to take part in this study.</p>
            </center>
        </div>`,
    ],
    show_clickable_nav: true,
    on_finish: function() {
        const consentChecked = document.getElementById("consent_checkbox").checked;
        if (!consentChecked) {
            alert("You must agree to participate before proceeding.");
            jsPsych.endCurrentTimeline(); // Stops experiment if checkbox is not checked
        }
    }
  });

  // Switch to fullscreen
  timeline.push({
    type: FullscreenPlugin,
    fullscreen_mode: true,
  });

  // Instructions 1
  const instructions_1 = {
    type: instructions,
    pages: [
    // Building blocks
    `<h2>Instructions</h2><br><br>` +
    'We will now give you some instructions about this experiment.<br>' +
    'After each instruction, you will be required to answer a quiz question correctly to move onto the following instruction.<br>' +
    'Otherwise, you will automatically be shown the instruction again.<br><br>' +
    'In this experiment, you will be seeing compositions made out of several building blocks.<br>' + 
    'These are the four blocks that you will be working with.<br>' +
    '<div style="display: flex; justify-content: center; gap: 20px; margin-top: 20px; margin-bottom: 20px;">' +
      `<img src=${imgBlock[0]} alt="Block 4" width="180" height="60">` +
      `<img src=${imgBlock[1]} alt="Block 1" width="100" height="100">` +
      `<img src=${imgBlock[2]} alt="Block 2" width="100" height="100">` +
      `<img src=${imgBlock[3]} alt="Block 3" width="60" height="180">` +
    '</div><br>', 

    // Example constructions and silhouettes [How many blocks are in each silhouette?]
    'You will be seeing any 3 of these 4 blocks at a time, placed into a composition.<br>' +
    'No block will be repeated, i.e. exist twice in the same composition.<br>' +
    'Here are some examples of compositions.<br>' +
    '<div style="display: flex; justify-content: center; gap: 50px; margin-top: 50px; margin-bottom: 50px;">' +
      `<img src=${instructionsColor[0]} alt="Sample Composition #1" width="200" height="200">` +
      `<img src=${instructionsColor[1]} alt="Sample Composition #2" width="200" height="200">` +
      `<img src=${instructionsColor[2]} alt="Sample Composiion #3" width="200" height="200">` +
    '</div>' +
    '<br>Importantly, you will not see these compositions in full color. Instead, what you will see is their silhouette form.<br>' +
    'Here are what those constructions will look like in their corresponding silhouette forms.<br>' +
    '<div style="display: flex; justify-content: center; gap: 50px; margin-top: 50px; margin-bottom: 50px;">' +
      `<img src=${instructionsSilhouette[0]} alt="Sample Composition #1" width="200" height="200">` +
      `<img src=${instructionsSilhouette[1]} alt="Sample Composition #2" width="200" height="200">` +
      `<img src=${instructionsSilhouette[2]} alt="Sample Composiion #3" width="200" height="200">` +
    '</div><br>',
    ],
    show_clickable_nav: true,
  };

  const question_1 = {
    type: SurveyMultiChoicePlugin,
    data: { quiz: "quiz_1" },
    questions: [
      {
        prompt: "How many blocks will be in each silhouette?",
        options: ["2", "3", "4", "5"],
        correct: "3",
        required: true,
      },
    ],
    randomize_question_order: false,
  };

  // Loop node to repeat instruction + quiz until correct
  const loop_1 = {
    timeline: [instructions_1, question_1],
    loop_function: function(data) {
      const last_trial = data.values().find(trial => trial.quiz === "quiz_1");
  
      if (!last_trial || !last_trial.response) return true; // repeat if broken
  
      const responses = last_trial.response;
      const questions = question_1.questions;
  
      let correct_count = 0;
      questions.forEach((q, idx) => {
        const user_answer = responses[`Q${idx}`];
        if (user_answer === q.correct) {
          correct_count++;
        }
      });
  
      return correct_count !== questions.length; // repeat if not all are correct
    }
  };
  
  timeline.push(loop_1);
  

  // Instructions 2
  const instructions_2 = {
    type: instructions,
    pages: [
      // Possible relations between any given pair of parts [Which of the following is not a possible relation?]
      'When the blocks are in the composition, each pair of blocks will have a relationship with one another.<br>' +
      'For example, consider this composition.<br>' +
      `<div style="display: flex; justify-content: center; gap: 50px; margin-top: 50px; margin-bottom: 50px;">` +
      `<img src=${instructionsColor[0]} alt="Sample Composition #1" width="200" height="200"></div>` +
      '<br>Now consider the following blocks that are a part of this composition.<br>' +
      `<div style="display: flex; justify-content: center; gap: 50px; margin-top: 50px; margin-bottom: 50px;">` +
        `<img src=${imgBlock[0]} alt="Block 4" width="180" height="60">` + 
        `<img src=${imgBlock[2]} alt="Block 2" width="100" height="100">` +
        `<img src=${imgBlock[3]} alt="Block 3" width="60" height="180">` +
      '</div>' +
      '<br>They are in the following relationships.<br>' +
      'The stone block is <strong>to the left of</strong> the brick block.<br>' +
      'The brick block is <strong>to the right of</strong> the stone block.<br>' +
      'The steel block is <strong>above</strong> the brick block.<br>' +
      'The brick block is <strong>below</strong> the steel block.<br>' +
      'The stone block is <strong>not connected to</strong> the steel block, and vice versa.<br><br>',
    ],
    show_clickable_nav: true,
  };
    
  const question_2 = {
    type: SurveyMultiChoicePlugin,
    data: { quiz: "quiz_2" },
    questions: [
      {
        prompt: "Which of the following is not a possible relation?",
        options: ["Above", "Below", "To the left of", "To the right of", "Did not connect", "All of these are possible relations"],
        correct: "All of these are possible relations",
        required: true,
      },
    ],
    randomize_question_order: false,
  };

  // Loop node to repeat instruction + quiz until correct
  const loop_2 = {
    timeline: [instructions_2, question_2],
    loop_function: function(data) {
      const last_trial = data.values().find(trial => trial.quiz === "quiz_2");
  
      if (!last_trial || !last_trial.response) return true; // repeat if broken
  
      const responses = last_trial.response;
      const questions = question_2.questions;
  
      let correct_count = 0;
      questions.forEach((q, idx) => {
        const user_answer = responses[`Q${idx}`];
        if (user_answer === q.correct) {
          correct_count++;
        }
      });
  
      return correct_count !== questions.length; // repeat if not all are correct
    }
  };
  
  timeline.push(loop_2);  

  // Instructions 3
  const instructions_3 = {
    type: instructions,
    pages: [
      // The task itself [Which block are you responding with respect to? & How many seconds will you see the silhoeutte for?]
      'In this task, you will first be shown a black silhouette of a composition for 6 seconds.<br><br>' +
      `<img src=${instructionsSilhouette[1]} alt="Sample Composition #2" width="200" height="200">` +
      '<br><br>You will then be shown an image with 2 blocks: one in the upper left, and one in the middle. For example:<br><br>' +
      `<img src=${instructionsQuestion[0]} alt="Sample Question #2" width="400" height="400">` +
      '<br><br>Both of these blocks were in the composition. It is your task to identify the relationship they were in to the best of your ability.<br>' +
      'You must answer <strong>with respect to the top left block.</strong><br>' +
      'In this example, the correct answer would be <strong>to the left of</strong>, because the brick block is to the left of the steel block.<br>' +
      'You can imagine the upper left block in any of the corresponding locations surrounding the middle block.<br><br>',
     ],
    show_clickable_nav: true,
  };
  const question_3 = {
    type: SurveyMultiChoicePlugin,
    data: { quiz: "quiz_3" },
    questions: [
      {
        prompt: "You will be selecting the relation with respect to the ____ block.",
        options: ["Left", "Right"],
        correct: "Left",
        required: true,
      },
      {
        prompt: "How many milliseconds will you have to look at the silhouette?",
        options: ["4000 ms", "5000 ms", "6000 ms", "7000 ms"],
        correct: "6000 ms",
        required: true,
      },
    ],
    randomize_question_order: false,
  };
  
  // Loop node to repeat instruction + quiz until both are correct
  const loop_3 = {
    timeline: [instructions_3, question_3],
    loop_function: function(data) {
      const last_trial = data.values().find(trial => trial.quiz === "quiz_3");
  
      if (!last_trial || !last_trial.response) return true; // repeat if broken
  
      const responses = last_trial.response;
      const questions = question_3.questions;
  
      let correct_count = 0;
      questions.forEach((q, idx) => {
        const user_answer = responses[`Q${idx}`];
        if (user_answer === q.correct) {
          correct_count++;
        }
      });
  
      // Only move on if both answers are correct
      return correct_count !== questions.length;
    }
  };
  
  timeline.push(loop_3);  

  // Instructions 4
  const instructions_4 = {
    type: instructions,
    pages: [
      // Redundancies [If two blocks are in a certain relationship (to the left of, to the right of, above, or below) but they are not touching, you should answer 'do not connect.']
      'Here is another example silhouette.<br><br>' +
      `<img src=${instructionsSilhouette[0]} alt="Sample Composition #1" width="200" height="200">` +
      '<br><br>You will then be shown the following question:<br><br>' +
      `<img src=${instructionsQuestion[2]} alt="Sample Question #1" width="200" height="200">` +
      '<br><br>You are answering with respect to the top left block.<br>' +
      'The correct answer is <strong>to the right of</strong>.<br><br>' +
      '<h2>Redundancies</h2><br>' +
      'You may notice that some blocks are both to the left of, to the right of, above, or below one another, but they also do not connect with one another (i.e., they are in that relation but they do not touch each other.<br>' +
      'In such a case, <strong>you must ignore the relation and answer <em>do not connect.</em></strong><br><br>', 

      // Key mappings
      'In order to make a response, please use the following key mappings to respond:<br><br>' +
      `<img src=${instructionsQuestion[1]} alt="Sample Buttons" width="400" height="400">` +
      '<br><br>Please make your best guess, even if you are not certain.<br>' +
      'For the first part of the experiment, you will be shown feedback immediately about whether or not your choice was correct.<br><br>' +
      'You will now be shown your final quiz question. If you get it correct, you will be shown practice trials.<br><br>',
    ],
    show_clickable_nav: true,
  };
    
  const question_4 = {
    type: SurveyMultiChoicePlugin,
    data: { quiz: "quiz_4" },
    questions: [
      {
        prompt: "If two blocks are in a certain relationship (to the left of, to the right of, above, or below) but they are not touching, you should answer 'do not connect.'",
        options: ["True", "False"],
        correct: "True",
        required: true,
      },
    ],
    randomize_question_order: false,
  };

  // Loop node to repeat instruction + quiz until correct
  const loop_4 = {
    timeline: [instructions_4, question_4],
    loop_function: function(data) {
      const last_trial = data.values().find(trial => trial.quiz === "quiz_4");
  
      if (!last_trial || !last_trial.response) return true; // repeat if broken
  
      const responses = last_trial.response;
      const questions = question_4.questions;
  
      let correct_count = 0;
      questions.forEach((q, idx) => {
        const user_answer = responses[`Q${idx}`];
        if (user_answer === q.correct) {
          correct_count++;
        }
      });
  
      return correct_count !== questions.length; // repeat if not all correct
    }
  };
  
  timeline.push(loop_4);  
  
  // Practice procedure

  // Instruction transition
  const instruction_transition = {
    type: instructions,
    pages: [
      'Great job! You have answered all the quiz questions correctly.<br>' +
      'You may now proceed to the practice trials.<br><br>',
    ],
    show_clickable_nav: true
  };
  timeline.push(instruction_transition);

  // Practice procedure
  var practice_procedure = {
    timeline: [infTrial, probeTrial],
    timeline_variables: practiceSession,
  };
  timeline.push(practice_procedure);

  // Practice transition
  timeline.push({
    type: instructions,
    pages: [
      'You have now completed the practice.<br>' +
      'Click below to begin the experiment.<br><br>'
    ],
    show_clickable_nav: true,
    });

    
  // Training session
  var train_procedure = {
    timeline: [infTrial, probeTrial],
    timeline_variables: trainSession,
  };
  timeline.push(train_procedure);

  // Training transition
    timeline.push({
      type: instructions,
      pages: [
        'You have now completed the first part of the experiment.<br>' +
        'In the next part, you will no longer be shown any feedback.<br>' +
        'Please try to make your best guess.<br><br>',
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
  await jsPsych.run(timeline);

  // Return the jsPsych instance so jsPsych Builder can access the experiment results
  return jsPsych;

}

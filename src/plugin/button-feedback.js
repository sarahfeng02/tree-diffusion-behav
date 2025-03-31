import { JsPsych, JsPsychPlugin, ParameterType } from "jspsych";

const info = {
  name: "button-feedback",
  version: "1.0.0",
  parameters: {
    stimulus: {
      type: ParameterType.STRING,
      default: "",
      description: "This is the file path to the PNG of the stimulus shown on-screen."
    },
    buttons: {
      type: ParameterType.ARRAY,
      default: ["On-top", "Left", "Right", "Below", "Did not connect"],
      description: "These are the button choices shown on-screen to the participant."
    },
    choices: {
      type: ParameterType.ARRAY, 
      default: ["ArrowUp", "ArrowLeft", "ArrowRight", "ArrowDown", " "],
      description: "These are the keys that the user is allowed to press."
    },
    correct_relation: {
      type: ParameterType.INT,
      default: null,
      description: "This is the correct answer (the actual relation)."
    },
    feedback_duration: {
      type: ParameterType.INT,
      default: 1000,
      description: "This is the duration in ms that the feedback is shown on-screen after the user response."
    },
    trial_duration: {
      type: ParameterType.INT,
      default: 600,
      description: "This is the duration in ms that the trial goes overall if the user does not respond."
    }
  },
};

/**
 * @author Sarah Feng
 * @see {@link https://github.com/sarahfeng02/tree-diffusion-behav}
 */

class HtmlButtonFeedbackPlugin {

  constructor(jsPsych) {
    this.jsPsych = jsPsych;
    this.response_made = false; // default until a response is made
  }

  trial(display_element, trial) {
    // show image and buttons
    let htmlcontent = `
      <div style="text-align: center;">
        <img src ="${trial.stimulus}" height="500" width="600"></img>
      </div>
      <div style="display: flex; justify-content: center; gap: 10px;">
        <button id="arrowup" class="response-btn">On-top</button>
      </div>
      <div style="display: flex; justify-content: center; gap: 10px; margin-top: 10px;">
        <button id="arrowleft" class="response-btn">Left</button>
        <button id="arrowright" class="response-btn">Right</button>
      </div>
      <div style="display: flex; justify-content: center; gap: 10px; margin-top: 10px;">
        <button id="arrowdown" class="response-btn">Below</button>
      </div>
      <div style="display: flex; justify-content: center; gap: 30px; margin-top: 10px;">
        <button id=" " class="response-btn">Did not connect</button>
      </div>
    `;
    display_element.innerHTML = htmlcontent;

    // set up a keyboard event to respond only to the spacebar
    this.jsPsych.pluginAPI.getKeyboardResponse({
      callback_function: (info) => {
        console.log('callback function called');
        this.handle_key_response(info.key, trial, info.rt);
      },
      valid_responses: trial.choices,
      persist: false
    });

    console.log('listener set up');

    // timeout if there is no response made
    this.timeout_id = setTimeout(() => {
      this.handle_timeout();
    }, trial.trial_duration);
  }

  handle_key_response(key, trial, rt) {

    // map response to relation ID to compare with correct response
    let relation_ans;
    if (key === 'arrowup') {
      relation_ans = 'above';
    } else if (key === 'arrowleft') {
      relation_ans = 'left';
    } else if (key === 'arrowright') {
      relation_ans = 'right';
    } else if (key === 'arrowdown') {
      relation_ans = 'below';
    } else if (key === ' ') {
      relation_ans = 'notConnected';
    }
    console.log('key ', key, ' relation ans ', relation_ans);

    // compare to see if the response is correct
    let is_correct = relation_ans === trial.correct_relation;
    console.log('correct?', is_correct);

    // providing visual feedback
    let button = document.getElementById(key);
    // if there was a key response, change color and then wait 1000ms
    if (button) {
      console.log('button ', button);
      this.response_made = true;

      if (is_correct) {
        button.style.backgroundColor = 'lightgreen';
      } else {
        button.style.backgroundColor = 'red';
      }
      button.style.fontWeight = 'bold';

      console.log('response made? ', this.response_made);
      
      setTimeout(() => {
        this.jsPsych.finishTrial({
          rt: rt,
          response_key: key,
          ans_relation: relation_ans,
          correct: is_correct,
          response_made: this.response_made
        })
      }, trial.feedback_duration);
    }  
  }

  // if there is no response made
  handle_timeout() {
    this.jsPsych.finishTrial({
      rt: null,
      response_key: null,
      ans_relation: null,
      correct: null,
      response_made: false
    })
  }
}

HtmlButtonFeedbackPlugin.info = info;

export default HtmlButtonFeedbackPlugin;
import help1 from "../images/help/help1.png";
import help2 from "../images/help/help2.png";
import help3 from "../images/help/help3.png";
import help4 from "../images/help/help4.png";
import help5 from "../images/help/help5.png";
import help6 from "../images/help/help6.png";
import help7 from "../images/help/help7.png";
import "../app.css";
export default function Help() {
  return (
    <main className="about-container">
      <h1>Help</h1>
      <section>

        <p>
          Brainsequences is designed as a platform for sharing knowledge about neuroscience with non-specialists. If you have expertise in neuroscience or related fields, you can contribute by creating new sequences, editing existing ones, or (in a future version) providing feedback on content.
        </p>
      </section>

      <section>
         <h3>How to Contribute</h3>
        <ol>
          <li>Use the user icon in the top-right corner to sign up. Fill in the usual Captcha verification.
            <br/><img src={help1} alt="Sign up button" className="help-image" style={{width: "200px"}} />
          </li>
          <li>Click on the green "+" button to create a new sequence.
            <br/><img src={help2} alt="Create new sequence" className="help-image" style={{width: "150px"}} />
          </li>
          <li>Type the title and click "Create".
            <br/><img src={help3} alt="Create new sequence" className="help-image" style={{width: "150px"}} />
          </li>
          <li>Click the "Add Step" button to add steps to your sequence.
            <br/><img src={help4} alt="Add step" className="help-image" style={{width: "150px"}} />
          </li>
          <li>Fill in the step title. Add in links and brain parts: you can click the "?" for help with this. Fill in the description below to explain the step. 
            <br/><img src={help6} alt="Edit step" className="help-image" style={{width: "400px"}} />
          </li>
          <li>Click "Save" to save your work. Note that this will not publish your sequence until you click the "Publish" button. Until then only you will have access to it.
            <br/><img src={help7} alt="Save and publish" className="help-image" style={{width: "150px"}} />
          </li>



        </ol>
      </section>

      <section>
        <h2>Need More Information?</h2>
        <p>
          Visit the About page for project background, credits, and technology
          details.
        </p>
      </section>
    </main>
  );
}
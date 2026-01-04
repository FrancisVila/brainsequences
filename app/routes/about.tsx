import AtlasImage from "../components/AtlasImage";
import toto from '../images/tim_taylor.svg';

export default function About() {
  return (
    <main className="about-container">
      <h1>About Brain Sequences</h1>
              <section className="floatAtlas">
            <h2>The Atlas</h2>
                  <AtlasImage 
        atlasSvg={toto}
        highlightedIds={["Cerebellum", "pons", "Medulla"]}
      />
          <ul>
                      <li>In this example, the highlighted areas are <i>Pons</i> and <i>Cerebellum</i>.</li>
            <li>Brain Sequences provides an Atlas of brain regions, sensory organs, and the endocrine system. The user can select different <i>views</i> of the atlas, but the <i>layout</i> always remains the same. This is to provide an invariant reference map where users can locate areas they have learned about. It conforms with the UX principles of <i>consistency</i> and <i>stay on the page</i>. </li>

            <li>To avoid overwhelming the users with excess information, the default view is a sketch that focusses on the highlighted items. </li>

          </ul>
        </section>
      <div>
        <section>
          <h2>What is Brain Sequences?</h2>
          <p>
            Brain Sequences is an educational application designed to help students, or the general public, to understand how different areas of the brain interact and function together, in different situations of life.
          </p>
          <p>
            Brain Sequences will also provide an interface to allow teachers and researchers to contribute new sequences.
          </p>
          <p>
            The basic learning tool of the application is the Atlas, shown and described on the right.
          </p>
        </section>

        <section>
          <h2>Technology</h2>
          <p>
            Built with React Router, Vite, SVG, and other modern web technologies to provide
            a fast and interactive learning experience.
          </p>
        </section>
        <section>
          <h2>Open Source & License</h2>
          <p>
            This project is open source. The resources contained in Brain Sequences are free to use for non-commercial projects. 
            If you use these resources, please mention Francis Vila in your credits.
          </p>
        </section>
        <section>
          <h2>Credits</h2>
          <ul>
            <li><a href="https://fontawesome.com/">Font Awesome</a> for the icons of the senses.</li>
            <li>Tim Taylor's <a href="https://www.innerbody.com/image/nerv02.html">map of the Human Brain on Innerbody</a> for the initial brain illustrations and vector graphic. </li>
            <li></li>

          </ul>
        </section>
      </div>
    </main>
  );
}

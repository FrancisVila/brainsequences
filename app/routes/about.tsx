import AtlasImage from "../components/AtlasImage";
import toto from '../images/tim_taylor.svg';

export default function About() {
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-6">About Brain Sequences</h1>
      
      <div className="prose max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What is Brain Sequences?</h2>
          <p className="text-lg mb-4">
            Brain Sequences is an educational application designed to help users understand
            how different areas of the brain interact and function together, in different situations of life..
          </p>
          <p className="text-lg mb-4">
            Brain Sequences will also provide an interface to allow teachers and researchers to contribute new sequences..
          </p>
        </section>

        <section className="mb-8">
            <h2>Atlas</h2>
                  <AtlasImage 
        atlasSvg={toto}
        atlasIds={["Cerebellum", "pons", "Medulla"]}
        links={[{from: 'VTA', to: 'Frontal_Pole', label: 'dopamine'}]}
      />

        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Means to reach these goals</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Design an Atlas of brain regions, sensory organs, and the endocrine system. The use can select different views of the atlas, but the layout always remains the same. This is to provide an invariant reference map where users can locate areas they have learned about. It conforms with the UX principles of consistency and stay on the page. </li>
            <li>To avoid overwhelming the users with excess information, the default view is a sketch that focusses on the atlas items. </li>
            <li>Learn about brain part connections and functions</li>
            <li>Educational resources and detailed information</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Technology</h2>
          <p className="text-lg">
            Built with React Router, Vite, and modern web technologies to provide
            a fast and interactive learning experience.
          </p>
        </section>
      </div>
    </main>
  );
}

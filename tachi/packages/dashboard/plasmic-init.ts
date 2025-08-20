import { initPlasmicLoader } from "@plasmicapp/loader-nextjs";

export const PLASMIC = initPlasmicLoader({
  projects: [
    {
      id: "buLarKS5F8q92wwXeZGLFH", // Your Plasmic project ID
      token: "ZU88h5Arn3DiRyi2XncRcW5eCAjalqMWyO6KvmrVYpA5uw521OPhmOkcgNwYaj1DJuzpDmvJEqfcQZlgDw", // Your Plasmic API token
    },
  ],

  // By default Plasmic will use the last published version of your project.
  // For development, you can set preview to true, which will use the unpublished
  // version from the Plasmic editor, if you are logged in as a project editor.
  preview: process.env.NODE_ENV === "development",
});

// You can register any code components that you want to use here; see
// https://docs.plasmic.app/learn/code-components-ref/
// And you can also register your project dependencies here; see
// https://docs.plasmic.app/learn/app-hosting#options

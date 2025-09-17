// Enhanced Onboarding Page - Single Page Experience
// This file is owned by you, feel free to edit as you see fit.
import * as React from "react";
import { PageParamsProvider as PageParamsProvider__ } from "@plasmicapp/react-web/lib/host";
import GlobalContextsProvider from "../components/plasmic/tachi_landing_page/PlasmicGlobalContextsProvider";
import OnboardingFlow from "../components/OnboardingFlow";
import { useRouter } from "next/router";

function Onboarding() {
  // Use the enhanced OnboardingFlow component for a modern single-page experience
  // This provides better UX with state persistence and smooth transitions

  const router = useRouter();

  return (
    <GlobalContextsProvider>
      <PageParamsProvider__
        route={router?.pathname}
        params={router?.query}
        query={router?.query}
      >
        <OnboardingFlow />
      </PageParamsProvider__>
    </GlobalContextsProvider>
  );
}

export default Onboarding;

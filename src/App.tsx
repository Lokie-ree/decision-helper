import {
  Authenticated,
  Unauthenticated,
  useQuery,
  useAction,
} from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster, toast } from "sonner";
import { useState } from "react";
import { AnimatedGradientText } from "./components/magicui/animated-gradient-text";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm p-4 flex justify-between items-center border-b">
        <h2 className="text-xl font-semibold accent-text">DecisionHelper</h2>
        <SignOutButton />
      </header>
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-2xl mx-auto">
          <Content />
        </div>
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const [question, setQuestion] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<{
    pros: string[];
    cons: string[];
  } | null>(null);

  const analyze = useAction(api.decisions.analyze);
  const recentDecisions = useQuery(api.decisions.listRecent) ?? [];

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;

    setAnalyzing(true);
    try {
      const result = await analyze({ question });
      setAnalysis(result);
      setQuestion("");
    } catch (error) {
      toast.error("Failed to analyze decision");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <AnimatedGradientText className="text-5xl font-bold mb-4">
          DecisionHelper
        </AnimatedGradientText>
        <Authenticated>
          <p className="text-xl text-slate-600">
            Welcome back, {loggedInUser?.email ?? "friend"}!
          </p>
        </Authenticated>
        <Unauthenticated>
          <p className="text-xl text-slate-600">Sign in to analyze decisions</p>
        </Unauthenticated>
      </div>

      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>

      <Authenticated>
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div>
            <label
              htmlFor="question"
              className="block text-sm font-medium text-gray-700"
            >
              What's your decision?
            </label>
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="e.g., Should I buy a new laptop now or wait for the next model?"
              rows={3}
            />
          </div>
          <button
            type="submit"
            disabled={analyzing || !question.trim()}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
          >
            {analyzing ? "Analyzing..." : "Analyze"}
          </button>
        </form>

        {analysis && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Pros</h3>
              <ul className="list-disc pl-5 space-y-1">
                {analysis.pros.map((pro, i) => (
                  <li key={i} className="text-green-700">
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">Cons</h3>
              <ul className="list-disc pl-5 space-y-1">
                {analysis.cons.map((con, i) => (
                  <li key={i} className="text-red-700">
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {recentDecisions.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Recent Decisions</h3>
            <div className="space-y-4">
              {recentDecisions.map((decision) => (
                <div key={decision._id} className="border rounded-lg p-4">
                  <p className="font-medium mb-2">{decision.question}</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-green-800 mb-1">
                        Pros
                      </h4>
                      <ul className="list-disc pl-5 text-sm">
                        {decision.pros.map((pro, i) => (
                          <li key={i}>{pro}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-red-800 mb-1">
                        Cons
                      </h4>
                      <ul className="list-disc pl-5 text-sm">
                        {decision.cons.map((con, i) => (
                          <li key={i}>{con}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Authenticated>
    </div>
  );
}

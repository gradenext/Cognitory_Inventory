import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const components = {
  h1: (props) => <h2 className="text-2xl font-bold mt-8 mb-3" {...props} />,
  h2: (props) => <h2 className="text-2xl font-bold mt-8 mb-3" {...props} />,
  h3: (props) => <h3 className="text-xl font-bold mt-6 mb-2" {...props} />,
  h4: (props) => <h4 className="text-lg font-bold mt-5 mb-2" {...props} />,
  p: (props) => <p className="my-3 leading-7" {...props} />,
  ul: (props) => <ul className="list-disc pl-6 my-3 space-y-1" {...props} />,
  ol: (props) => <ol className="list-decimal pl-6 my-3 space-y-1" {...props} />,
  a: (props) => <a className="text-purple-700 underline" target="_blank" rel="noreferrer" {...props} />,
  blockquote: (props) => <blockquote className="border-l-4 border-purple-300 pl-4 my-4 italic" {...props} />,
  code: (props) => <code className="bg-gray-100 rounded px-1 py-0.5 text-sm" {...props} />,
  table: (props) => (
    <div className="overflow-x-auto my-4">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  th: (props) => <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-left" {...props} />,
  td: (props) => <td className="border border-gray-300 px-3 py-2 align-top" {...props} />,
  img: (props) => <img className="rounded-lg my-4 max-w-full" alt="" {...props} />,
};

const MarkdownPreview = ({ markdown }) => (
  <div className="bg-white text-gray-900 rounded-xl p-5 min-h-[20rem] overflow-y-auto">
    {markdown?.trim() ? (
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    ) : (
      <p className="text-gray-400 text-sm">Nothing to preview yet.</p>
    )}
  </div>
);

export default MarkdownPreview;

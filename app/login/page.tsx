"use client";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-6rem)] px-4">
      <div className="w-full max-w-md border border-white/10 rounded-lg p-6 bg-[#0A0A0A]/50 backdrop-blur-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Login
          </h1>
          <p className="text-[#A3A3A3] text-sm">
            Enter your SRN and password to access PESU Connect
          </p>
        </div>

        <form className="space-y-6">
          <div>
            <label
              htmlFor="srn"
              className="block text-sm font-medium text-white mb-2"
            >
              SRN
            </label>
            <input
              type="text"
              id="srn"
              name="srn"
              required
              className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-[#A3A3A3] focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
              placeholder="Enter your SRN"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-white mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-[#A3A3A3] focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="w-full px-8 py-3 bg-[#7C3AED] text-white rounded-lg font-bold text-base hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-shadow cursor-pointer"
          >
            Login
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-[#A3A3A3]">
            Your password is not saved on the server side.
          </p>
        </div>
      </div>
    </div>
  );
}

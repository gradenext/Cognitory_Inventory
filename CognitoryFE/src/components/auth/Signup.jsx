import React, { useState } from "react";
import Input from "../shared/Input";
import { Link, useNavigate } from "react-router-dom";
import { validateWithZod } from "../../validations/validate";
import { signupSchema } from "../../validations/auth";
import toast from "react-hot-toast";
import { signup } from "../../services/auth";
import { Loader2 } from "lucide-react";

const Signup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setErrors((prev) => ({
      ...prev,
      [e.target.name]: null,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const validationResult = validateWithZod(signupSchema, {
        name: form?.name,
        email: form?.email,
        password: form?.password,
        confirmPassword: form?.confirmPassword,
      });
      if (!validationResult?.success) {
        console.log(validationResult.errors);
        setErrors(validationResult.errors);
        toast.error("Check all required fields");
        return;
      }

      setLoading(true);
      const response = await signup({
        name: form?.name,
        email: form?.email,
        password: form?.password,
        confirmPassword: form?.confirmPassword,
      });

      toast.success(response.message);

      setForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      navigate("/login");
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-center">Create Account</h2>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-y-2 text-white"
        autoComplete="off"
      >
        <Input
          label="Full Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Your name"
          error={errors.name}
          disabled={loading}
        />

        <Input
          label="Email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@example.com"
          type="email"
          error={errors.email}
          disabled={loading}
        />

        <div className="relative">
          <Input
            label="Password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="********"
            type={showPassword ? "text" : "password"}
            error={errors.password}
            disabled={loading}
          />
          <span
            className="hover:underline text-black font-semibold cursor-pointer absolute top-1/3 translate-y-4/5 right-4 text-xs select-none"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? "hide" : "show"}
          </span>
        </div>

        <div className="relative">
          <Input
            label="Confirm Password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="********"
            type={showConfirmPassword ? "text" : "password"}
            error={errors.confirmPassword}
            disabled={loading}
          />
          <span
            className="hover:underline text-black font-semibold cursor-pointer absolute top-1/3 translate-y-4/5 right-4 text-xs select-none"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
          >
            {showConfirmPassword ? "hide" : "show"}
          </span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className=" bg-white text-black hover:text-white hover:bg-black py-2 px-4 my-2 rounded-lg font-medium transition duration-200 cursor-pointer"
        >
          {loading ? (
            <Loader2 className="animate-spin mx-auto" />
          ) : (
            "Create Account"
          )}
        </button>

        <div className="text-sm text-white/60 text-center flex flex-col justify-center items-center">
          <div>Already have an account?</div>
          <Link to="/login" className="underline hover:text-white">
            Log in
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Signup;

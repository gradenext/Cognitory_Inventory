import React, { useState } from "react";
import Input from "../shared/Input";
import { Link } from "react-router-dom";
import { AtSign, Loader2, LogIn } from "lucide-react";
import toast from "react-hot-toast";
import { forgotPassword } from "../../services/auth";
import { validateWithZod } from "../../validations/validate";
import { z } from "zod";

const ForgetPassword = () => {
  const [form, setForm] = useState({
    email: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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
      setLoading(true);
      const validationResult = validateWithZod(
        z.object({
          email: z.string().email("Invalid email"),
        }),
        { email: form?.email }
      );
      if (!validationResult?.success) {
        setErrors(validationResult.errors);
        toast.error("Check all required fields");
        return;
      }

      const response = await forgotPassword(form?.email);

      toast.success(response.message);

      setForm({
        email: "",
      });
    } catch (error) {
      console.log(error);
      toast.error(error.response.data.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-center mb-2">
        Recover your account
      </h2>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-y-4 text-white"
        autoComplete="off"
      >
        <Input
          label="Email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Enter your email"
          type="email"
          error={errors.email}
        />

        <button
          type="submit"
          className="my-2 bg-white text-black hover:text-white hover:bg-black py-2 px-4 rounded-lg font-medium transition duration-200 cursor-pointer"
        >
          {loading ? <Loader2 className="animate-spin mx-auto" /> : "Submit"}
        </button>

        <div className="text-sm text-white/60 text-center flex justify-center items-center gap-x-4">
          <Link
            to={"/login"}
            className="hover:underline hover:text-white flex justify-center items-center gap-x-2"
          >
            <LogIn size={16} />
            Login
          </Link>
          <Link
            to={"/signup"}
            className="hover:underline hover:text-white flex justify-center items-center gap-x-2"
          >
            <AtSign size={16} />
            Sign up
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ForgetPassword;

import React, { useState } from "react";
import Input from "../shared/Input";
import { Link, useParams } from "react-router-dom";
import { AtSign, Loader2, LogIn } from "lucide-react";
import toast from "react-hot-toast";
import { validateWithZod } from "../../validations/validate";
import { z } from "zod";
import { resetPassword } from "../../services/auth";
import { resetPasswordSchema } from "../../validations/auth";

const ResetPassword = () => {
  const { token } = useParams();
  const [form, setForm] = useState({
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
      setLoading(true);
      const validationResult = validateWithZod(resetPasswordSchema, {
        newPassword: form?.password,
        confirmPassword: form?.confirmPassword,
      });
      if (!validationResult?.success) {
        setErrors(validationResult.errors);
        toast.error("Check all required fields");
        return;
      }

      const response = await resetPassword(token, {
        newPassword: form?.password,
        confirmPassword: form?.confirmPassword,
      });

      toast.success(response.message);

      setForm({
        password: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-center mb-2">
        Reset you password
      </h2>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-y-4 text-white"
        autoComplete="off"
      >
        <div className="relative">
          <Input
            label="Password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="********"
            type={showPassword ? "text" : "password"}
            error={errors.newPassword}
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
            {showPassword ? "hide" : "show"}
          </span>
        </div>

        <button
          type="submit"
          className="my-2 bg-white text-black hover:text-white hover:bg-black py-2 px-4 rounded-lg font-medium  transition duration-200 cursor-pointer"
        >
          {loading ? <Loader2 className="animate-spin mx-auto" /> : "Submit"}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;

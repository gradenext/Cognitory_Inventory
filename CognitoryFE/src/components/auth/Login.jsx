import React, { useState } from "react";
import Input from "../shared/Input";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { validateWithZod } from "../../validations/validate";
import { userLogin } from "../../validations/auth";
import { login } from "../../services/auth";
import { useDispatch } from "react-redux";
import { setToken, setUser } from "../../redux/slice/userSlice";
import { Loader2 } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

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
      const validationResult = validateWithZod(userLogin, form);
      if (!validationResult?.success) {
        console.log(validationResult.errors);
        setErrors(validationResult.errors);
        toast.error("Check all required fields");
        return;
      }

      setLoading(true);
      const response = await login({
        email: form?.email,
        password: form?.password,
      });

      toast.success(response.message);

      setForm({
        email: "",
        password: "",
      });

      dispatch(setToken(response?.data?.token));
      dispatch(setUser(response?.data?.user));
      const role = response?.data?.user?.role;
      navigate(
        role === "admin" ? "/admin" : role === "super" ? "/super" : "/user"
      );
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-center ">Welcome Back</h2>
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

        <button
          type="submit"
          disabled={loading}
          className="my-2 bg-white text-black hover:text-white hover:bg-black py-2 px-4 rounded-lg font-medium transition duration-200 cursor-pointer"
        >
          {loading ? <Loader2 className="animate-spin mx-auto" /> : "Log In"}
        </button>

        <Link
          to={"/forget-password"}
          className="hover:underline hover:text-white text-sm text-white/60 text-center flex justify-center items-center gap-x-2"
        >
          Forgot Password
        </Link>

        <div className="text-sm text-white/60 text-center flex flex-col justify-center items-center">
          <div>Don't have an account?</div>
          <Link to={"/signup"} className="underline hover:text-white">
            Sign up
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Login;

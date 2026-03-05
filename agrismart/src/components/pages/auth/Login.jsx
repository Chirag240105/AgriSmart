import React, { useContext, useState } from "react";
import { toast } from "react-toastify";
import axiosInstances from "../../../utils/axiosInstances";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { API_PATH } from "../../../utils/apiPath";
import { useNavigate } from "react-router-dom";
import { validateEmail } from "../../../utils/helper";
import { userContext } from "../../../context/Context";

import { motion } from "framer-motion";
import Lottie from "lottie-react";

import farmerAnimation from "../../../assets/farm.json";

const Login = () => {
 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { updateUser } = useContext(userContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      toast("Enter email");
     setError("Enter your email to login");
      return;
    }

    if (!password) {
      toast("Enter password");
      setError("Enter your password to login");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Send JSON for login; this route does not use multer.
      const response = await axiosInstances.post(API_PATH.AUTH.LOGIN, {
        email,
        password,
      });

      const { token, user } = response.data;

      if (token && user) {
        localStorage.setItem("token", token);

        updateUser(user);

        toast.success("Successfully logged in the account ||");
        navigate("/dashboard");
      }
    } catch (err) {
     console.error("Login error:", err);

const status = err?.response?.status;
const message = err?.response?.data?.message || "Something went wrong";

if (status === 400 || status === 401) {
  toast.error(message);
} else if (status === 500 || status === 502) {
  toast.error("Server error - please try again later");
} else {
  toast.error(message);
}

setError(message);
} finally {
  setLoading(false);
}
  };


  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 25 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-amber-50 to-green-100 p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-green-100 overflow-hidden"
      >
        <div className="absolute -top-10 -right-16 opacity-20 pointer-events-none">
          <Lottie animationData={farmerAnimation} loop autoplay className="w-72" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
        <h1 className="text-2xl font-bold text-green-700">Welcome Back</h1>
<p className="text-sm text-gray-500 mt-1">
Login to access your farming network dashboard
</p>
        </motion.div>

        {error && <p className="text-sm text-red-500 text-center mb-4">{error}</p>}

        <motion.form
          variants={container}
          initial="hidden"
          animate="show"
          onSubmit={handleLogin}
          className="space-y-4"
        >

          <motion.div variants={item}>
            <label className="text-sm font-medium text-gray-700">Email</label>

            <input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-4 py-2 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </motion.div>

          <motion.div variants={item} className="relative">
            <label className="text-sm font-medium text-gray-700">Password</label>

            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-4 py-2 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400"
            />

            <span
              className="absolute right-3 top-10 text-gray-500 text-[18px] cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </motion.div>

         <motion.div variants={item}>
  <label className="text-sm font-medium text-gray-700">Select Role</label>

  <div className="flex gap-6 mt-2">
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input type="radio" name="role" value="farmer" className="accent-green-600" />
      Farmer
    </label>

    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input type="radio" name="role" value="buyer" className="accent-green-600" />
      Buyer
    </label>
  </div>
</motion.div>
          <motion.button
            variants={item}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold text-white transition-all
            ${loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700 shadow-md"}`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                Logging in the account...
              </span>
            ) : (
              "Login"
            )}
          </motion.button>
        </motion.form>
          <a
  onClick={() => navigate('/signup')}
  className="text-blue-500 hover:text-blue-700 cursor-pointer text-sm font-medium transition duration-200"
>
 Don't have an account? Signup
</a>
        <p className="text-xs text-center text-gray-500 mt-6">
          Helping farmers connect with buyers directly.
        </p>
      </motion.div>
    </div>
  );
};

export default Login;



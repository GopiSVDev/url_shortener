import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { login } from "@/api/authApi";
import { toast } from "sonner";

const LoginForm = () => {
  const [formValues, setFormValues] = useState({
    username: "",
    password: "",
  });

  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({
      ...formValues,
      [e.target.name]: e.target.value,
    });
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    setErrorMsg(null);
  };

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!formValues.username.trim()) {
      newErrors.username = "Username is required";
    }
    if (!formValues.password) {
      newErrors.password = "Password is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      await login({
        username: formValues.username,
        password: formValues.password,
      });
      toast.success("Login Successful");
    } catch (error) {
      if (error instanceof Error)
        toast.error("Username or password is incorrect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Login into your account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <form className="space-y-6" onSubmit={onSubmit} noValidate>
          <div>
            <label
              htmlFor="username"
              className="uppercase text-xs font-bold text-zinc-500 dark:text-white"
            >
              Username
            </label>
            <Input
              id="username"
              name="username"
              placeholder="Enter Your Username"
              className={`bg-slate-100 dark:bg-slate-500 border-0 focus-visible:ring-0 text-black focus-visible:ring-offset-0 dark:text-white ${
                errors.username ? "border border-red-500" : ""
              }`}
              value={formValues.username}
              onChange={handleChange}
            />
            {errors.username && (
              <p className="text-red-500 text-xs mt-1">{errors.username}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="uppercase text-xs font-bold text-zinc-500 dark:text-white"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              name="password"
              placeholder="Enter Password"
              className={`bg-slate-100 dark:bg-slate-500 border-0 focus-visible:ring-0 text-black focus-visible:ring-offset-0 dark:text-white ${
                errors.password ? "border border-red-500" : ""
              }`}
              value={formValues.password}
              onChange={handleChange}
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          {errorMsg && (
            <p className="text-red-600 text-sm text-center">{errorMsg}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default LoginForm;

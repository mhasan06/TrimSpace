const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/components/BookingFlow.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const target = `  const handleInPlaceLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      const result = await signIn("credentials", { email: loginForm.email, password: loginForm.password, loginType: "CUSTOMER", redirect: false });
      if (result?.error) setLoginError("Invalid email or password.");
  };`;

const replacement = `  const handleEmailSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!loginForm.email) return;
      setIsCheckingEmail(true);
      const exists = await checkEmailExists(loginForm.email);
      setAuthEmail(loginForm.email);
      if (exists) {
          setAuthStep('PASSWORD');
      } else {
          setRegForm(prev => ({ ...prev, email: loginForm.email }));
          setAuthStep('REGISTER');
      }
      setIsCheckingEmail(false);
  };

  const handleInPlaceLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError("");
      const result = await signIn("credentials", { email: loginForm.email, password: loginForm.password, loginType: "CUSTOMER", redirect: false });
      if (result?.error) setLoginError("Invalid email or password.");
  };

  const handleInPlaceRegistration = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError("");
      const result = await registerCustomer(regForm);
      if (result.error) {
          setLoginError(result.error);
      } else {
          await signIn("credentials", { email: regForm.email, password: regForm.password, loginType: "CUSTOMER", redirect: false });
      }
  };`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(filePath, content);
    console.log("Success");
} else {
    console.log("Target not found");
}

const handleEmailSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!loginForm.email) return;
      setIsCheckingEmail(true);
      setLoginError("");
      try {
        const exists = await checkEmailExists(loginForm.email);
        setAuthEmail(loginForm.email);
        if (exists) {
            setAuthStep('PASSWORD');
        } else {
            setRegForm(prev => ({ ...prev, email: loginForm.email }));
            setAuthStep('REGISTER');
        }
      } catch (err) {
        setLoginError("Something went wrong. Please try again.");
      } finally {
        setIsCheckingEmail(false);
      }
  };

  const handleInPlaceLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError("");
      const result = await signIn("credentials", { 
          email: loginForm.email, 
          password: loginForm.password, 
          loginType: "CUSTOMER", 
          redirect: false 
      });
      if (result?.error) setLoginError("Invalid email or password.");
  };

  const handleInPlaceRegistration = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError("");
      const result = await registerCustomer(regForm);
      if (result.error) {
          setLoginError(result.error);
      } else {
          await signIn("credentials", { 
              email: regForm.email, 
              password: regForm.password, 
              loginType: "CUSTOMER", 
              redirect: false 
          });
      }
  };

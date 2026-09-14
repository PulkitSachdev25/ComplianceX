import React from 'react';
import { SignInPage, Testimonial } from "@/components/ui/sign-in";

const sampleTestimonials: Testimonial[] = [
  {
    avatarSrc: "https://cdn.21st.dev/assets/mirror/9f/9f797e4acee1a4de4f9b4c3aa1cc4e89d7c9efd5dbff1c463d88374ed601d719.jpg",
    name: "Sarah Chen",
    handle: "@sarahdigital",
    text: "Amazing platform! The user experience is seamless and the features are exactly what I needed."
  },
  {
    avatarSrc: "https://cdn.21st.dev/assets/mirror/8d/8d9a61a581c43fe2088f221b7692c95db4b3ad5c0da0c856400c0e5acdcdcea8.jpg",
    name: "Marcus Johnson",
    handle: "@marcustech",
    text: "This service has transformed how I work. Clean design, powerful features, and excellent support."
  },
  {
    avatarSrc: "https://cdn.21st.dev/assets/mirror/a6/a634d4f02fe5b77804943c1d74b8d70e35ffe26454e0e9af9717432a2c72bfde.jpg",
    name: "David Martinez",
    handle: "@davidcreates",
    text: "I've tried many platforms, but this one stands out. Intuitive, reliable, and genuinely helpful for productivity."
  },
];

const SignInPageDemo = () => {
  const handleSignIn = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());
    console.log("Sign In submitted:", data);
    alert(`Sign In Submitted! Check the browser console for form data.`);
  };

  const handleGoogleSignIn = () => {
    console.log("Continue with Google clicked");
    alert("Continue with Google clicked");
  };
  
  const handleResetPassword = () => {
    alert("Reset Password clicked");
  }

  const handleCreateAccount = () => {
    alert("Create Account clicked");
  }

  return (
    <div className="bg-background text-foreground">
      <SignInPage
        heroImageSrc="https://cdn.21st.dev/assets/mirror/ec/ecff1664e7fc3185d0e947571f984ea5fa3de9580fb0e73a03cd9c9b3461cb09.jpg"
        testimonials={sampleTestimonials}
        onSignIn={handleSignIn}
        onGoogleSignIn={handleGoogleSignIn}
        onResetPassword={handleResetPassword}
        onCreateAccount={handleCreateAccount}
      />
    </div>
  );
};

export default SignInPageDemo;

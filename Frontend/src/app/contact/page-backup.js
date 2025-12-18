"use client";
import { useTranslations } from '@/hooks/useTranslations';
import emailjs from '@emailjs/browser';
import { AlertCircle, CheckCircle, Clock, HelpCircle, Mail, MessageSquare, Phone, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// Intersection Observer Hook
const useIntersectionObserver = (options = {}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !isVisible) {
        setIsVisible(true);
      }
    }, { threshold: 0.2, ...options });
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);
  
  return [ref, isVisible];
};

// Animated Input Component
const AnimatedInput = ({ label, name, type = "text", error, value, onChange }) => {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <div className="relative">
      <label 
        className={`absolute left-3 transition-all duration-300 pointer-events-none ${
          isFocused || value 
            ? '-top-2.5 text-xs bg-white dark:bg-[#1E1D1A] px-2 text-[#359487] dark:text-[#C6FE02]' 
            : 'top-3 text-gray-500 dark:text-gray-400'
        }`}
      >
        {label} *
      </label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`
          w-full rounded-lg p-3 pt-4
          border-2 transition-all duration-300
          ${error 
            ? 'border-red-500 dark:border-red-500' 
            : isFocused 
              ? 'border-[#359487] dark:border-[#C6FE02]' 
              : 'border-gray-300 dark:border-[#4A4744]'
          }
          dark:bg-[#1E1D1A] dark:text-white
          focus:outline-none focus:ring-2 
          ${error 
            ? 'focus:ring-red-500/30' 
            : 'focus:ring-[#359487]/30 dark:focus:ring-[#C6FE02]/30'
          }
          hover:border-[#359487] dark:hover:border-[#C6FE02]
        `}
      />
      {error && (
        <span className="text-red-500 text-sm mt-1 flex items-center gap-1 animate-shake">
          <AlertCircle size={14} />
          {error}
        </span>
      )}
    </div>
  );
};

// Animated Textarea
const AnimatedTextarea = ({ label, name, error, value, onChange }) => {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <div className="relative">
      <label 
        className={`absolute left-3 transition-all duration-300 pointer-events-none ${
          isFocused || value 
            ? '-top-2.5 text-xs bg-white dark:bg-[#1E1D1A] px-2 text-[#359487] dark:text-[#C6FE02]' 
            : 'top-3 text-gray-500 dark:text-gray-400'
        }`}
      >
        {label} *
      </label>
      <textarea
        name={name}
        rows={7}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`
          w-full rounded-lg p-3 pt-6
          border-2 transition-all duration-300 resize-none
          ${error 
            ? 'border-red-500 dark:border-red-500' 
            : isFocused 
              ? 'border-[#359487] dark:border-[#C6FE02]' 
              : 'border-gray-300 dark:border-[#4A4744]'
          }
          dark:bg-[#1E1D1A] dark:text-white
          focus:outline-none focus:ring-2 
          ${error 
            ? 'focus:ring-red-500/30' 
            : 'focus:ring-[#359487]/30 dark:focus:ring-[#C6FE02]/30'
          }
          hover:border-[#359487] dark:hover:border-[#C6FE02]
        `}
      />
      {error && (
        <span className="text-red-500 text-sm mt-1 flex items-center gap-1 animate-shake">
          <AlertCircle size={14} />
          {error}
        </span>
      )}
    </div>
  );
};

// Contact Info Card
const ContactInfoCard = ({ icon: Icon, title, content, delay = 0 }) => {
  const [ref, isVisible] = useIntersectionObserver();
  
  return (
    <div
      ref={ref}
      className={`flex items-start gap-4 mb-8 transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="bg-gradient-to-br from-[#359487] to-[#2a7569] dark:from-[#C6FE02] dark:to-[#a8d902] p-4 rounded-xl shadow-lg hover:scale-110 transition-transform duration-300">
        <Icon size={24} className="text-white dark:text-black" />
      </div>
      <div>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">{title}</p>
        <p className="dark:text-white font-medium text-lg">{content}</p>
      </div>
    </div>
  );
};

// FAQ Item
const FAQItem = ({ question, answer, delay = 0 }) => {
  const [ref, isVisible] = useIntersectionObserver();
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white dark:bg-[#2A2825] p-6 rounded-xl mb-4 cursor-pointer border border-gray-200 dark:border-[#3A3835] hover:border-[#359487] dark:hover:border-[#C6FE02] hover:shadow-lg transition-all duration-300"
      >
        <div className="flex justify-between items-center">
          <p className="text-lg font-semibold dark:text-white flex items-center gap-2">
            <HelpCircle size={20} className="text-[#359487] dark:text-[#C6FE02]" />
            {question}
          </p>
          <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="text-gray-600 dark:text-gray-400">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
        <div
          className={`overflow-hidden transition-all duration-300 ${
            isOpen ? 'max-h-40 mt-4' : 'max-h-0'
          }`}
        >
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
};

const Page = () => {
  const { t } = useTranslations();
  const [formRef, formVisible] = useIntersectionObserver();
  const [toast, setToast] = useState({ show: false, type: "success", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: ''
  });

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => {
      setToast((t) => ({ ...t, show: false }));
    }, 3000);
  };

  const nameRegex = /^[\p{L}\s]{3,30}$/u;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9]{11}$/;
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { firstName, lastName, email, phone, message } = formData;

    const newErrors = { firstName: "", lastName: "", email: "", phone: "", message: "" };
    let hasError = false;

    if (!nameRegex.test(firstName.trim())) {
      newErrors.firstName = t('contact.errors.firstName');
      hasError = true;
    }

    if (!nameRegex.test(lastName.trim())) {
      newErrors.lastName = t('contact.errors.lastName');
      hasError = true;
    }

    if (!emailRegex.test(email.trim())) {
      newErrors.email = t('contact.errors.email');
      hasError = true;
    }

    if (!phoneRegex.test(phone.trim())) {
      newErrors.phone = t('contact.errors.phone');
      hasError = true;
    }

    if (message.trim().length < 10) {
      newErrors.message = t('contact.errors.message');
      hasError = true;
    }

    setErrors(newErrors);

    if (hasError) {
      setIsSubmitting(false);
      return;
    }

    // Send email using EmailJS
    emailjs
      .send(
        "service_stzzgp7",  // Your EmailJS Service ID
        "template_0l6hqcg", // Your EmailJS Template ID
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          user_email: email.trim(),
          user_phone: phone.trim(),
          message: message.trim()
        },
        "aFgvqEvdcPcxOsnQn" // Your EmailJS Public Key
      )
      .then(() => {
        showToast("success", t('contact.success'));
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          message: ''
        });
        setIsSubmitting(false);
      })
      .catch((error) => {
        console.error("EmailJS Error:", error);
        showToast("error", t('contact.error'));
        setIsSubmitting(false);
      });
  };

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-b from-[#F3F3F3] to-[#E8E8E8] dark:from-[#181715] dark:to-[#1F1D1A]">
      {/* Hero Section */}
      <div className="text-center pt-16 pb-12 px-4">
        <h1 className="text-[#359487] font-bold text-5xl md:text-7xl pb-6 dark:text-[#C6FE02] dark:drop-shadow-[0_0_20px_rgba(198,254,2,0.6)] animate-fade-in">
          {t('contact.title')}
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto animate-fade-in-up">
          {t('contact.subtitle')}
        </p>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-8 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-xl shadow-2xl text-white font-medium flex items-center gap-3 animate-slide-down ${
          toast.type === "success" ? "bg-gradient-to-r from-green-500 to-green-600" : "bg-gradient-to-r from-red-500 to-red-600"
        }`}>
          {toast.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {toast.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div
            ref={formRef}
            className={`lg:col-span-2 bg-white dark:bg-[#2B2927] rounded-3xl p-8 md:p-10 shadow-xl border border-gray-200 dark:border-[#3A3734] transition-all duration-700 ${
              formVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="flex items-center gap-3 mb-8">
              <MessageSquare size={28} className="text-[#359487] dark:text-[#C6FE02]" />
              <h2 className="text-2xl font-bold dark:text-white">{t('contact.title')}</h2>
            </div>

            <div>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <AnimatedInput 
                  label={t('contact.form.firstName')}
                  name="firstName" 
                  error={errors.firstName}
                  value={formData.firstName}
                  onChange={handleChange}
                />
                <AnimatedInput 
                  label={t('contact.form.lastName')}
                  name="lastName" 
                  error={errors.lastName}
                  value={formData.lastName}
                  onChange={handleChange}
                />
                <AnimatedInput 
                  label={t('contact.form.email')}
                  name="email" 
                  type="email" 
                  error={errors.email}
                  value={formData.email}
                  onChange={handleChange}
                />
                <AnimatedInput 
                  label={t('contact.form.phone')}
                  name="phone" 
                  type="tel" 
                  error={errors.phone}
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-6">
                <AnimatedTextarea 
                  label={t('contact.form.message')}
                  name="message" 
                  error={errors.message}
                  value={formData.message}
                  onChange={handleChange}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-[#359487] to-[#2a7569] dark:from-[#C6FE02] dark:to-[#a8d902] text-white dark:text-black font-semibold py-4 px-6 rounded-xl hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white dark:border-black border-t-transparent" />
                    {t('contact.form.sending')}
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    {t('contact.form.submit')}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white dark:bg-[#2C2A27] rounded-3xl p-8 shadow-xl border border-gray-200 dark:border-[#3A3734]">
            <h2 className="text-2xl font-bold mb-8 dark:text-white">Contact Information</h2>
            
            <ContactInfoCard icon={Mail} title={t('contact.info.email.title')} content={t('contact.info.email.content')} delay={0} />
            <ContactInfoCard icon={Phone} title={t('contact.info.phone.title')} content={t('contact.info.phone.content')} delay={100} />
            <ContactInfoCard icon={Clock} title={t('contact.info.hours.title')} content={t('contact.info.hours.content')} delay={200} />
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 bg-white dark:bg-[#2B2927] rounded-3xl p-8 md:p-10 shadow-xl border border-gray-200 dark:border-[#3A3734]">
          <div className="flex items-center gap-3 mb-8">
            <HelpCircle size={28} className="text-[#359487] dark:text-[#C6FE02]" />
            <h2 className="text-2xl font-bold dark:text-white">{t('contact.faq.title')}</h2>
          </div>

          <div className="space-y-4">
            <FAQItem
              question={t('contact.faq.q1.question')}
              answer={t('contact.faq.q1.answer')}
              delay={0}
            />
            <FAQItem
              question={t('contact.faq.q2.question')}
              answer={t('contact.faq.q2.answer')}
              delay={100}
            />
            <FAQItem
              question={t('contact.faq.q3.question')}
              answer={t('contact.faq.q3.answer')}
              delay={200}
            />
            <FAQItem
              question={t('contact.faq.q4.question')}
              answer={t('contact.faq.q4.answer')}
              delay={300}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out 0.3s both;
        }

        .animate-slide-down {
          animation: slide-down 0.5s ease-out;
        }

        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Page;



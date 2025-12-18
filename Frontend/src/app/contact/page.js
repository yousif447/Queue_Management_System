"use client";
import AnimatedInput from '@/components/ContactPage/AnimatedInput';
import AnimatedTextarea from '@/components/ContactPage/AnimatedTextarea';
import ContactInfoCard from '@/components/ContactPage/ContactInfoCard';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useTranslations } from '@/hooks/useTranslations';
import emailjs from '@emailjs/browser';
import { CheckCircle, AlertCircle, Clock, HelpCircle, Mail, MessageSquare, Phone, Send, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const FAQItem = ({ question, answer, delay = 0 }) => {
  const [ref, isVisible] = useIntersectionObserver();
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div ref={ref} className={`transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`} style={{ transitionDelay: `${delay}ms` }}>
      <div onClick={() => setIsOpen(!isOpen)} className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl cursor-pointer border border-gray-200 dark:border-gray-700/50 hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:shadow-lg transition-all duration-300">
        <div className="flex justify-between items-center gap-4">
          <p className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <HelpCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
            </span>
            {question}
          </p>
          <ChevronDown size={20} className={`text-gray-400 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
        <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-40 mt-4 pl-11' : 'max-h-0'}`}>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{answer}</p>
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
  
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', message: '' });
  const showToast = (type, message) => { setToast({ show: true, type, message }); setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000); };

  const nameRegex = /^[\p{L}\s]{3,30}$/u;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9]{11}$/;
  const [errors, setErrors] = useState({ firstName: "", lastName: "", email: "", phone: "", message: "" });

  const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { firstName, lastName, email, phone, message } = formData;
    const newErrors = { firstName: "", lastName: "", email: "", phone: "", message: "" };
    let hasError = false;

    if (!nameRegex.test(firstName.trim())) { newErrors.firstName = t('contact.errors.firstName'); hasError = true; }
    if (!nameRegex.test(lastName.trim())) { newErrors.lastName = t('contact.errors.lastName'); hasError = true; }
    if (!emailRegex.test(email.trim())) { newErrors.email = t('contact.errors.email'); hasError = true; }
    if (!phoneRegex.test(phone.trim())) { newErrors.phone = t('contact.errors.phone'); hasError = true; }
    if (message.trim().length < 10) { newErrors.message = t('contact.errors.message'); hasError = true; }
    setErrors(newErrors);
    if (hasError) { setIsSubmitting(false); return; }

    emailjs.send("service_stzzgp7", "template_0l6hqcg", { firstName: firstName.trim(), lastName: lastName.trim(), user_email: email.trim(), user_phone: phone.trim(), message: message.trim() }, "aFgvqEvdcPcxOsnQn")
      .then(() => { showToast("success", t('contact.success')); setFormData({ firstName: '', lastName: '', email: '', phone: '', message: '' }); setIsSubmitting(false); })
      .catch((error) => { console.error("EmailJS Error:", error); showToast("error", t('contact.error')); setIsSubmitting(false); });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero Section */}
      <section className="relative py-20 px-6 bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto text-center max-w-4xl relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-full mb-6 animate-fade-in">
            <Mail size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span className="text-emerald-700 dark:text-emerald-400 text-sm font-medium">{t('contact.hero.badge')}</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
            <span className="text-gray-900 dark:text-white">{t('contact.hero.titlePart1')}</span>
            <span className="gradient-text">{t('contact.hero.titlePart2')}</span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed animate-fade-in-up max-w-2xl mx-auto">
            {t('contact.subtitle')}
          </p>
        </div>
      </section>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-8 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-2xl text-white font-medium flex items-center gap-3 animate-fade-in ${toast.type === "success" ? "bg-gradient-to-r from-emerald-500 to-teal-600" : "bg-gradient-to-r from-red-500 to-rose-600"}`}>
          {toast.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {toast.message}
        </div>
      )}

      <section className="py-16 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Form */}
            <div ref={formRef} className={`lg:col-span-2 bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-3xl p-8 md:p-10 border border-gray-200 dark:border-gray-700/50 shadow-xl transition-all duration-700 ${formVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <MessageSquare size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('contact.title')}</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{t('contact.form.subtitle')}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <AnimatedInput label={t('contact.form.firstName')} name="firstName" error={errors.firstName} value={formData.firstName} onChange={handleChange} />
                <AnimatedInput label={t('contact.form.lastName')} name="lastName" error={errors.lastName} value={formData.lastName} onChange={handleChange} />
                <AnimatedInput label={t('contact.form.email')} name="email" type="email" error={errors.email} value={formData.email} onChange={handleChange} />
                <AnimatedInput label={t('contact.form.phone')} name="phone" type="tel" error={errors.phone} value={formData.phone} onChange={handleChange} />
              </div>

              <div className="mb-8">
                <AnimatedTextarea label={t('contact.form.message')} name="message" error={errors.message} value={formData.message} onChange={handleChange} />
              </div>

              <button onClick={handleSubmit} disabled={isSubmitting} className="btn-primary w-full py-4 flex items-center justify-center gap-3">
                {isSubmitting ? (<><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />{t('contact.form.sending')}</>) : (<><Send size={20} />{t('contact.form.submit')}</>)}
              </button>
            </div>

            {/* Contact Information */}
            <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700/50 shadow-xl h-fit">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">{t('contact.info.title')}</h2>
              <div className="space-y-4">
                <ContactInfoCard icon={Mail} title={t('contact.info.email.title')} content={t('contact.info.email.content')} delay={0} />
                <ContactInfoCard icon={Phone} title={t('contact.info.phone.title')} content={t('contact.info.phone.content')} delay={100} />
                <ContactInfoCard icon={Clock} title={t('contact.info.hours.title')} content={t('contact.info.hours.content')} delay={200} />
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-16 bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-3xl p-8 md:p-10 border border-gray-200 dark:border-gray-700/50 shadow-xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <HelpCircle size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('contact.faq.title')}</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('contact.faq.subtitle')}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <FAQItem question={t('contact.faq.q1.question')} answer={t('contact.faq.q1.answer')} delay={0} />
              <FAQItem question={t('contact.faq.q2.question')} answer={t('contact.faq.q2.answer')} delay={100} />
              <FAQItem question={t('contact.faq.q3.question')} answer={t('contact.faq.q3.answer')} delay={200} />
              <FAQItem question={t('contact.faq.q4.question')} answer={t('contact.faq.q4.answer')} delay={300} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Page;



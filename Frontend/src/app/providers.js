"use client";
import { Toaster } from "react-hot-toast";
import { Provider } from "react-redux";
import { PaymentProvider } from "../contexts/PaymentContext";
import { SocketProvider } from "../contexts/SocketContext";
import store from "../redux/store";

const Providers = ({children}) => {
    return (
        <Provider store={store}>
            <SocketProvider>
                <PaymentProvider>
                    {children}
                    <Toaster 
                        position="top-right"
                        reverseOrder={false}
                        gutter={12}
                        containerStyle={{
                            top: 20,
                            right: 20,
                        }}
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: '#ffffff',
                                color: '#1f2937',
                                padding: '16px 20px',
                                borderRadius: '16px',
                                boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                border: '1px solid #e5e7eb',
                                fontSize: '14px',
                                fontWeight: '500',
                                maxWidth: '400px',
                            },
                            success: {
                                duration: 4000,
                                style: {
                                    background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                                    color: '#065f46',
                                    border: '1px solid #a7f3d0',
                                },
                                iconTheme: {
                                    primary: '#10b981',
                                    secondary: '#ffffff',
                                },
                            },
                            error: {
                                duration: 5000,
                                style: {
                                    background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                                    color: '#991b1b',
                                    border: '1px solid #fca5a5',
                                },
                                iconTheme: {
                                    primary: '#ef4444',
                                    secondary: '#ffffff',
                                },
                            },
                            loading: {
                                style: {
                                    background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
                                    color: '#0f766e',
                                    border: '1px solid #5eead4',
                                },
                                iconTheme: {
                                    primary: '#14b8a6',
                                    secondary: '#ffffff',
                                },
                            },
                        }}
                    />
                </PaymentProvider>
            </SocketProvider>
        </Provider>
    )
}

export default Providers;

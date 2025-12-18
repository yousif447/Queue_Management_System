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
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: '#363636',
                                color: '#fff',
                            },
                            success: {
                                iconTheme: {
                                    primary: '#C6FE02',
                                    secondary: '#000',
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


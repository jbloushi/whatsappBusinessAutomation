import React, { useState, useEffect, useRef,useMemo,useCallback } from 'react';
import './chatbot.css';
import { getTenantIdFromUrl,fixJsonString,setCSSVariable,getContactIDfromURL} from './chatbot/utilityfunctions.jsx';
import { renderMessageContent, renderInteractiveMessage,renderTemplateMessage } from './messageRenderers';
// import OpenAI from "openai";
import { toast } from "sonner";
import { Navigate, useNavigate, useParams } from "react-router-dom"; 
import {axiosInstance,fastURL, djangoURL} from "../../api.jsx";
import MailIcon from '@mui/icons-material/Mail';
import SearchIcon from '@mui/icons-material/Search';
import CallRoundedIcon from '@mui/icons-material/CallRounded';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close'
import FullPageLoader from './FullPageLoader.jsx';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import Picker from 'emoji-picker-react';

import axios from 'axios';
import { parse, v4 as uuidv4 } from 'uuid'; 
import {whatsappURL}  from '../../Navbar';

import io from 'socket.io-client';
import { PhoneIcon, PlusCircle, PlusIcon, Upload, X,Search, ChevronRight,ChevronLeft} from 'lucide-react';
import { useAuth } from '../../authContext.jsx';
import AuthPopup from './AuthPopup.jsx';
import { base, div } from 'framer-motion/client';
//import { Button, Input } from 'antd';
import { 
  Phone, 
  Mail, 
  Plus, 
} from "lucide-react";  
const socket = io(whatsappURL);




const Chatbot = () => {
  const tenantId=getTenantIdFromUrl();
  // const navigate = useNavigate();
  const [totalPages, setTotalPages] = useState(1);
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [messageTemplates, setMessageTemplates] = useState({});
  const [buttons, setButtons] = useState([]);
  const [showSmileys, setShowSmileys] = useState(false);
  const [inputFields, setInputFields] = useState([{ type: 'text', value: '' }]);
  const [profileImage, setProfileImage] = useState(null); 
  const [conversation, setConversation] = useState(['']);
  const [flows, setFlows] = useState([]);
  const [selectedFlow, setSelectedFlow] = useState('');
  const [previousContact, setPreviousContact] = useState(null);
  const [newMessages, setNewMessages] = useState([]);

  const [showPopup, setShowPopup] = useState(false);

  const [allConversations, setAllConversations] = useState({});
  const [allMessages, setAllMessages] = useState([]);

  const [unreadCounts, setUnreadCounts] = useState({});
  const messageEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [imageToSend, setImageToSend] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [imageCaption, setImageCaption] = useState('');
  const [imageMap, setImageMap] = useState({});

  const [isUploading, setIsUploading] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [businessPhoneNumberId, setBusinessPhoneNumberId] = useState('');
  const [headerMediaId, setHeaderMediaId] = useState('');
  // const tenantId = getTenantIdFromUrl();
  const [showNewChatInput, setShowNewChatInput] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const { authenticated } = useAuth();
  const [authPopupp, setAuthPopupp] = useState(false);
  const navigate = useNavigate();
  const [prioritizedContacts, setPrioritizedContacts] = useState([]);
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  
  const [isOpen, setIsOpen] = useState(false);
  const toggleFab = () => {
    setIsOpen(!isOpen);
  };
  const handleCloseAuthPopupp = () => {
    setAuthPopupp(false);
  };

  useEffect(() => {
    // Show popup only if not authenticated and not in demo mode
    setAuthPopupp(!authenticated);
  }, [authenticated]);


  useEffect(() => {
    fetchContacts();
  }, []);


  useEffect(() => {
    const fetchContact = async () => {
      const contactID = getContactIDfromURL();
      if (contactID) {
        // Delay to ensure contacts are loaded
        await new Promise(resolve => setTimeout(resolve, 2000));
        const contact = contacts.find(c => c.id === parseInt(contactID));
        setSelectedContact(contact);
        console.log("Selected Contact 1: ", parseInt(contactID));
      } else {
        console.log("No contact ID found in URL.");
      }
    };
  
    fetchContact();
  }, [contacts]); // Add contacts as a dependency
  

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);


  useEffect(() => {
    const fetchBusinessPhoneId = async () => {
      try {
        console.log("fetching business phone number id")
        const response = await axios.get(`${fastURL}/whatsapp_tenant/`, {
          headers: {
            'X-Tenant-Id': tenantId
          }
        });
        console.log(response.data.whatsapp_data[0].business_phone_number_id,"THIS IS BPID");
        setBusinessPhoneNumberId(response.data.whatsapp_data[0].business_phone_number_id);
      } catch (error) {
        console.error('Error fetching business phone ID:', error);
      }
    };

    fetchBusinessPhoneId();
  }, [tenantId]);
    
  const handlePhoneSearch = async () => {
    if (searchTerm.length !== 12 || !/^\d{12}$/.test(searchTerm)) {
      toast.warning('Invalid Phone Number', {
        description: 'Search term must be exactly 12 digits.',
        duration: 3000
      });
      return; // Exit the function if validation fails
    }
  
    try {
      const response = await axiosInstance.get(`${fastURL}/contacts/${currentPage}?phone=${searchTerm}`);
      
      if (response.data.page_no) {
        const updatedPage = response.data.page_no;
        setCurrentPage(updatedPage); // Update the state
        fetchContacts(updatedPage); // Use the updated value directly
      }
    } catch (error) {
      console.error('Error fetching contact page:', error);
      // Optionally handle error (show toast, etc.)
    }
  };

``
  /*const fetchContacts = async () => {
    try {
      const response = await axiosInstance.get(`${fastURL}/contacts`, {
        headers: {
          token: localStorage.getItem('token'),
        },
      });
      // Ensure all contacts have the necessary properties
      
      setContacts(response.data);
    } catch (error) {
      console.error("Error fetching contacts data:", error);
    }
  };*/
  const fetchContacts = async (page = 1) => {
    try {
      setIsLoading(true);
      
      // Fetch contacts for the specific page
      const response = await axiosInstance.get(`${fastURL}/contacts/${page}?order_by=last_replied&sort_by=desc`);
      setTotalPages(response.data.total_pages);
      
      // Process contacts for the current page
     
      
      // Set contacts to only the current page's contacts
      setContacts(response.data.contacts);
      
      // Update current page
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching contacts data:", error);
    } finally {
      setIsLoading(false);
    }
  };  

  const getInitials = (firstName, lastName) => {
      const firstInitial = firstName && firstName.charAt(0) ? firstName.charAt(0).toUpperCase() : '';
      const lastInitial = lastName && lastName.charAt(0) ? lastName.charAt(0).toUpperCase() : '';
      return firstInitial + lastInitial || '??';
  };

  const getAvatarColor = (initials) => {
      const charCode = (initials.charCodeAt(0) || 0) + (initials.charCodeAt(1) || 0);
      return `avatar-bg-${(charCode % 10) + 1}`;
  };


  useEffect(() => {
    const fetchTenantData = async () => {
      try {
        // const business_phone_number_id = 241683569037594;
        console.log("bpiddddddd: ", businessPhoneNumberId)
        const response = await axiosInstance.get(`${fastURL}/whatsapp_tenant/`);
        setAccessToken(response.data.whatsapp_data[0].access_token);

      } catch (error) {
        console.error('Error fetching tenant data:', error);
      }
    };  
    fetchTenantData();
  }, []);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsUploading(true);
      try {
        // Create FormData object
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'image'); // Adjust based on file type if needed
        formData.append('messaging_product', 'whatsapp');

        // Upload to Facebook Graph API
        const response = await axios.post(
          `https://graph.facebook.com/v16.0/${businessPhoneNumberId}/media`, //HARDCODE
          formData,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        console.log('File uploaded to WhatsApp, ID:', response.data.id);
        setHeaderMediaId(response.data.id);
        setImageToSend(response.data.id);

        if (response.data && response.data.id) {
          // Store the media ID
          const mediaId = response.data.id;
          
          // You might want to store this mediaId in state or use it immediately
          setImageToSend(mediaId);
          setShowImagePreview(true);

          // If you want to show a preview, you can still use FileReader
          const reader = new FileReader();
          reader.onload = (e) => {
            setImageMap(prevMap => ({
              ...prevMap,
              [mediaId]: e.target.result
            }));
          };
          reader.readAsDataURL(file);
        } else {
          throw new Error('Failed to upload media');
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Failed to upload file. Please try again.');
      } finally {
        setIsUploading(false);
      }
    }
  };


  const handleAddField = () => {
    setInputFields([...inputFields, { type: 'text', value: '' }]);
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleInputChange = (index, e) => {
    const newInputFields = [...inputFields];
    newInputFields[index].value = e.target.value;
    setInputFields(newInputFields);
  };

  const handleImageSend = async () => {
    if (!imageToSend || !selectedContact) return;
    let phoneNumber = selectedContact.phone;
    if (phoneNumber.startsWith("91")) {
      phoneNumber = phoneNumber.slice(2);
    }
    try {
      const response = await axiosInstance.post(
        `${whatsappURL}/send-message`,
        {
          phoneNumbers: [phoneNumber],
          messageType: "image",
          additionalData: {
            imageId: imageToSend, 
            caption: imageCaption
          },
          business_phone_number_id: businessPhoneNumberId
        }
      );

      if (response.status === 200) {
        setConversation(prev => [...prev, { 
          type: 'image', 
          sender: 'bot', 
          imageId: imageToSend,
          imageUrl: imageMap[imageToSend], // This is for preview purposes
          caption: imageCaption 
        }]);
        setImageToSend(null);
        setImageCaption('');
        setShowImagePreview(false);
      }
    } catch (error) {
      console.error('Error sending image:', error);
      alert('Failed to send image. Please try again.');
    }
  };


  const createNewContact = (contactPhone) => ({
    id: Date.now(), // Generate a unique ID or use another method
    phoneNumber: contactPhone,
    name: 'New Contact', // Default or empty name
    hasNewMessage: true // Default or initial state
  });

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [conversation]);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to the server');
    });
    
    socket.on('temp-user', (message) => {
      console.log("New temp user logged");
    
      if (message) {
        const storedSessionId = localStorage.getItem('sessionId');
        console.log("Stored session ID:", storedSessionId);
        console.log("Received message temp_user:", message.temp_user);
        
        const formattedMessageTempUser = `*/${message.temp_user}`;
        if (formattedMessageTempUser === storedSessionId) {
          console.log("Session ID matches. Adding new contact.");
        
          // Add new contact and select it
          setContacts(prevContacts => {
            // Create a new contact object
            const newContact = {
              id: message.temp_user + message.contactPhone,  // Use a unique combination for id
              phone: message.contactPhone
            };
        
            // Check if contact with the same ID already exists
            const contactExists = prevContacts.some(contact => contact.id === newContact.id);
        
            // If the contact doesn't exist, add it
            if (!contactExists) {
              const updatedContacts = [...prevContacts, newContact];
              console.log("New contacts array:", updatedContacts);
              return updatedContacts;
            }
        
            else console.log("Contact already exists. Skipping addition.");
            return prevContacts;  // Return the current contacts if no addition is made
          });
        
          setSelectedContact({
            phone: message.contactPhone
          });
        
          setShowNewChatInput(false);
        }else {
          console.log("Session ID does not match.");
        }
      } else {
        console.log("Message is undefined or null.");
      }
    });
    socket.on('new-message', (message) => {
      if (message&&message.phone_number_id==businessPhoneNumberId) {
        console.log('Got New Message', message);
        updateContactPriority(message.contactPhone, message.message);
        if (parseInt(message.contactPhone) == parseInt(selectedContact?.phone) && parseInt(message.phone_number_id) == parseInt(businessPhoneNumberId)) {
          console.log("hogyaaaaaaaaaaaaaaaaaaaaaaaaaaaa");  
          setConversation(prevMessages => [...prevMessages, { text: JSON.stringify(message.message), sender: 'user'}]);
          //setNewMessages(prevMessages => [...prevMessages, { text: message.message, sender: 'user'}]);
          } else {
          // Update unread count for non-selected contacts
          setContacts(prevContacts => 
            prevContacts.map(contact => 
              contact.phone === message.contactPhone
                ? { ...contact, unreadCount: (contact.unreadCount || 0) + 1 }
                : contact
            )
          );
      }}
    });

    socket.on('node-message', (message) => {
      console.log(message.message, "this is node");
      console.log(selectedContact,"yahandekhhhhhh");
      if (message) {
          if (parseInt(message.contactPhone) == parseInt(selectedContact?.phone) && parseInt(message.phone_number_id) == parseInt(businessPhoneNumberId)) {
            console.log("hogyaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
            setConversation(prevMessages => [...prevMessages, { text: JSON.stringify(message.message), sender: 'bot' }]);
          }

      }
    });
    return () => {
      socket.off('node-message');
      socket.off('new-message');
      socket.off('temp_user');
    };
  }, [selectedContact]);
    



  const handleSend = async () => {
    if (!selectedContact || !messageTemplates[selectedContact.id]) {
      toast.error('Please select a contact and enter a message');
      return;
    }

    const newMessage = { 
      content: messageTemplates[selectedContact.id],
      timestamp: new Date().toISOString(),
      sender: 'bot'
    };

    try {
      if (selectedContact.isGroup) {
        // Send message to all group members
        const sendPromises = selectedContact.members.map(memberId => {
          const member = contacts.find(c => c.id === memberId);
          let phoneNumber = member.phone;
          if (phoneNumber.startsWith("91")) {
            phoneNumber = phoneNumber.slice(2);
          }
          
          return axiosInstance.post(
            `${whatsappURL}/send-message`,
            {
              phoneNumbers: [phoneNumber],
              message: newMessage.content,
              business_phone_number_id: businessPhoneNumberId,
              messageType: "text",
            }
          );
        });
        await Promise.all(sendPromises);
      } else {
        // Send message to individual contact
        let phoneNumber = selectedContact.phone;
        if (phoneNumber.startsWith("91")) {
          phoneNumber = phoneNumber.slice(2);
        }
       axiosInstance.post(
          `${whatsappURL}/send-message`,
          {
            phoneNumbers: [phoneNumber],
            message: newMessage.content,
            business_phone_number_id: businessPhoneNumberId,
            messageType: "text",
          }
        );
      }

      setMessageTemplates(prevTemplates => ({
        ...prevTemplates,
        [selectedContact.id]: ''
      }));
      
      // Add success toast
      toast.success("Message sent successfully");
    } catch (error) {
      // Add error toast with specific error message
      toast.error(`Failed to send message: ${error.response?.data?.message || error.message || 'Unknown error'}`);
      console.error('Error sending message:', error);
    }
  };

  const getFilteredAndSortedContacts = () => {
    return contacts
      .filter(contact => {
        const searchLower = searchText.toLowerCase();
        return (
          contact.name?.toLowerCase().includes(searchLower) ||
          contact.phone?.toLowerCase().includes(searchLower) ||
          contact.email?.toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => {
        // First, sort by unread count
        if (b.unreadCount !== a.unreadCount) {
          return b.unreadCount - a.unreadCount;
        }
        // Then, sort by last message timestamp
        return (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0);
      });
  };

  const updateContactPriority = (contactPhone, message) => {
    setContacts(prevContacts => {
      const updatedContacts = prevContacts.map(contact => {
        if (contact.phone === contactPhone) {
          return {
            ...contact,
            unreadCount: (contact.unreadCount || 0) + 1,
            lastMessageTimestamp: new Date().getTime()
          };
        }
        return contact;
      });
      // Sort the contacts after updating
      return updatedContacts.sort((a, b) => {
        if (b.unreadCount !== a.unreadCount) {
          return b.unreadCount - a.unreadCount;
        }
        return (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0);
      });
    });
  };

  useEffect(() => {
    setPrioritizedContacts(getFilteredAndSortedContacts());
  }, [contacts, searchText]);

    
    // Function to fetch conversation data for a given contact
  const fetchConversation = async (contactId) => {
    try {
      const bpid_string = businessPhoneNumberId.toString()
      const response = await fetch(`${djangoURL}/whatsapp_convo_get/${contactId}/?source=whatsapp&bpid=${bpid_string}`, {
        method: 'GET',
        headers: {
          'X-Tenant-Id': tenantId
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data from backend');
      }
      const data = await response.json();
      console.log("Conversations: ", data)
     
      
     
      // Merge fetched data with any new messages
      const mergedConversation = [
        ...(allConversations[contactId] || []),
        ...data
      ];
      setAllConversations(prev => ({
        ...prev,
        [contactId]: mergedConversation
      }));
      setConversation(mergedConversation);

      console.log('Data fetched from backend successfully:', mergedConversation);
    } catch (error) {
      console.error('Error fetching data from backend:', error);
    }
  };

  const addInputField = () => {
    setInputFields([...inputFields, { value: '' }]);
  };

  const deleteInputField = (index) => {
    const newInputFields = inputFields.filter((_, i) => i !== index);
    setInputFields(newInputFields);
  };
    
  
  useEffect(() => {
    setConversation(['']);
    setNewMessages(['']);
    console.log("selected contact 3:", selectedContact)
    
    if(selectedContact){
    fetchConversation(selectedContact.phone);}
  }, [selectedContact]);

  const [isLoading, setIsLoading] = useState(false);

  const handleContactSelection = async (contact) => {
    try {
      // Set loading state to true at the start of the function
      setIsLoading(true);
  
      // Existing contact selection logic
      if (selectedContact) {
        setPreviousContact(selectedContact);
      }
      setSelectedContact({ ...contact, isGroup: false });
  
      // Reset unread count for selected contact
      setContacts(prevContacts =>
        prevContacts.map(c =>
          c?.id === contact.id ? { ...c, unreadCount: 0 } : c
        )
      );
  
      // Fetch conversation
      let contactMessages = [];
      if (!allConversations[contact.phone]) {
        await fetchConversation(contact.phone);
      }
  
      // Filter messages for the selected contact
      contactMessages = allMessages
        .filter(message => message.contactPhone === contact.phone)
        .map(message => ({
          text: message.text,
          sender: message.sender,
          timestamp: message.timestamp
        }));
  
      // Update conversation and reset states
      setConversation(contactMessages);
      setNewMessages([]);
      setUnreadCounts(prev => ({ ...prev, [contact.phone]: 0 }));
  
    } catch (error) {
      console.error('Error selecting contact:', error);
      // Optionally, add error handling or toast notification
    } finally {
      // Always set loading to false when operation completes
      setIsLoading(false);
    }
  };
  
  const handleToggleSmileys = () => {
    setShowSmileys(!showSmileys);
  };

  const handleSelectSmiley = (emoji) => {
    const newMessageTemplate = (messageTemplates[selectedContact?.id] || '') + emoji.emoji + ' ';
    setMessageTemplates(prevTemplates => ({
      ...prevTemplates,
      [selectedContact?.id]: newMessageTemplate
    }));
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadStatus('Uploading...');

    const jsonData = {};
    inputFields.forEach((field, index) => {
      jsonData[`description_${index}`] = field.value;
    });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('jsonData', JSON.stringify(jsonData));

    try {
      const response = await axiosInstance.post('/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadStatus('File uploaded successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus('Error uploading file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
    
  const fetchFlows = async () => {
    try {
      const response = await axiosInstance.get(`${fastURL}/node-templates/`, {
        headers: { token: localStorage.getItem('token') },
      });
      // Ensure each flow has an id property
      const flowsWithIds = response.data.map(flow => ({
        ...flow,
        id: flow.id.toString() // Ensure id is a string for consistency
      }));
      setFlows(flowsWithIds);
      console.log('Fetched flows:', flowsWithIds);
    } catch (error) {
      console.error("Error fetching flows:", error);
    }
  };

  useEffect(() => {
    fetchFlows();
  }, []);

  const handleFlowChange = (event) => {
    const selectedValue = event.target.value;
    console.log("Selected flow ID:", selectedValue);
    setSelectedFlow(selectedValue);
    const selectedFlowData = flows.find(flow => flow.id === selectedValue);
    console.log("Selected flow data:", selectedFlowData);
  };
    
  useEffect(() => {
    console.log("Selected flow has changed:", selectedFlow);
  }, [selectedFlow]);

  const [isSending, setIsSending] = useState(false);

  const handleSendFlowData = async () => {
    if (!selectedFlow) {
      console.error('No flow selected');
      return;
    }

    try {
      console.log("FLOW ID: ", selectedFlow)
      setIsSending(true);
      const dataToSend = {
        node_template_id: selectedFlow
      };
    
      console.log('Sending flow data:', dataToSend);
    
      // First POST request to insert data
      const insertResponse = await axiosInstance.post(
        `${djangoURL}/insert-data/`,
        dataToSend,
        {
          headers: {
            'Content-Type': 'application/json',
            token: localStorage.getItem('token'),
          },
        }
      );
    
      console.log('Flow data sent successfully:', insertResponse.data);
    
      // Check if the first request is successful
      if (insertResponse.status === 200) {
        // Second POST request to reset the session
        const resetSessionResponse = await axiosInstance.post(
          `${whatsappURL}/reset-session`,
          { business_phone_number_id: businessPhoneNumberId },
          {
            headers: {
              'Content-Type': 'application/json',
              token: localStorage.getItem('token'),
            },
          }
        );
    
        console.log('Session reset successfully:', resetSessionResponse.data);
    
        if (resetSessionResponse.status === 200) {
          console.log(`Session deleted successfully for ${businessPhoneNumberId}`);
        }
      }
    
    } catch (error) {
      console.error('Error occurred:', error);
    } finally {
      setIsSending(false);
    }
  };
    
    useEffect(() => { 
      navigate(window.location.pathname, { replace: true });
      console.log("selected contact 2 : ", selectedContact)
    }, [])

  const handleNewChat = async () => {
  if (!newPhoneNumber.trim()) return;

  try {
  const response = await axiosInstance.post(`${djangoURL}/contacts/`, {
    phone: newPhoneNumber,
    tenant: tenantId,
    // Add other required fields for creating a new contact
  }, {
    headers: { token: localStorage.getItem('token') },
  });

  const newContact = response.data;
  //setContacts(prev => sortContacts([newContact, ...prev]));
  setSelectedContact(newContact);
  setShowNewChatInput(false);
  setNewPhoneNumber('');
  } catch (error) {
  console.error("Error creating new contact:", error);
  }
  };
  const [searchTerm, setSearchTerm] = useState('');

  // Filtered and prioritized contacts based on search term
  const filteredContacts = useMemo(() => {
    if (!searchTerm) return contacts;
    
    const lowercasedSearch = searchTerm.toLowerCase();
    return contacts.filter(contact => 
      contact.name?.toLowerCase().includes(lowercasedSearch) ||
      contact.phone?.toLowerCase().includes(lowercasedSearch)
    );
  }, [contacts, searchTerm])
  const [showContactsDrawer, setShowContactsDrawer] = useState(false);
const [visibleMessages, setVisibleMessages] = useState([]);
const [hasMoreMessages, setHasMoreMessages] = useState(true);
const [currentPage, setCurrentPage] = useState(1);
const MESSAGES_PER_PAGE = 10;

// New function to load messages with pagination
const loadMessages = useCallback(() => {
  if (!selectedContact) return;

  const startIndex = Math.max(0, conversation.length - (currentPage * MESSAGES_PER_PAGE));
  const endIndex = conversation.length - ((currentPage - 1) * MESSAGES_PER_PAGE);
  
  const loadedMessages = conversation.slice(startIndex, endIndex);
  
  setVisibleMessages(prevMessages => [...loadedMessages, ...prevMessages]);
  setHasMoreMessages(startIndex > 0);
}, [conversation, currentPage, selectedContact]);

// Function to load more messages
const loadMoreMessages = useCallback(() => {
  setCurrentPage(prevPage => prevPage + 1);
}, []);

// Effect to load initial messages or reload when contact changes
useEffect(() => {
  if (selectedContact) {
  
    setVisibleMessages([]);
    setHasMoreMessages(true);
    loadMessages();
  }
}, [selectedContact, loadMessages]);

// Effect to load messages when current page changes
useEffect(() => {
  loadMessages();
}, [currentPage, loadMessages]);
const [inputPage, setInputPage] = useState(currentPage);

const handleNextPage = () => {
  if (currentPage < totalPages) {
    fetchContacts(currentPage + 1);
  }
};

const handlePreviousPage = () => {
  if (currentPage > 1) {
    fetchContacts(currentPage - 1);
  }
};

const handleGoToPage = (pageNumber) => {
  if (pageNumber >= 1 && pageNumber <= totalPages) {
    fetchContacts(pageNumber);
  }
};
function renderMessageWithNewLines(text) {
  try {
    // Ensure text is properly escaped for JSON.parse
    const sanitizedText = text.replace(/\\/g, "\\\\");
    
    // Decode Unicode escape sequences
    const decodedText = JSON.parse(`"${sanitizedText}"`);
    
    // Split by \n and render with line breaks
    return decodedText.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        <br />
      </React.Fragment>
    ));
  } catch (error) {
    console.error("Failed to render message:", error);
    return <div>Error rendering message</div>;
  }
}



  return (
  <div>
   <div className="md:hidden">
   <div className="mobile-chat-container flex flex-col h-screen">
  {/* Sliding Contacts Drawer */}
  <div className={`contacts-drawer fixed inset-0 z-50 transform transition-transform duration-300 ${
    showContactsDrawer ? 'translate-x-0' : '-translate-x-full'
  } bg-white w-full h-full overflow-hidden`} style={{zIndex:'201'}}>
    <div className="contacts-header flex items-center justify-between p-4 border-b">
      <h2 className="text-xl font-semibold">Contacts</h2>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setShowContactsDrawer(false)}
      >
        <X /> {/* Close icon */}
      </Button>
    </div>

    {/* Search Input */}
    <div className="p-4 border-b">
      <div className="relative">
      <Search 
  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
  size={20} 
  onClick={handlePhoneSearch}
/>
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search contacts"
          className="w-full pl-10"
        />
        
      </div>
    </div>
{/* Pagination Div */}
{/* Pagination Div */}
<div className="flex justify-center items-center space-x-2 p-4 border-t">
  <button 
    onClick={handlePreviousPage}
    disabled={currentPage === 1}
    className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
  >
    <ChevronLeft size={20} className="text-gray-600" />
  </button>
  
  <div className="flex items-center space-x-2">
    <input 
      type="number" 
      value={currentPage}
      onClick={(e) => e.target.select()}
      onChange={(e) => {
        const page = parseInt(e.target.value);
        if (!isNaN(page)) {
          setCurrentPage(page);
          handleGoToPage(page);
        }
      }}
      min="1"
      max={totalPages}
      className="w-16 text-center border rounded py-1 px-2"
    />
    <span className="text-gray-500">of {totalPages}</span>
  </div>
  
  <button 
    onClick={handleNextPage}
    disabled={currentPage === totalPages}
    className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
  >
    <ChevronRight size={20} className="text-gray-600" />
  </button>
</div>
    {/* Contact List */}
    <div className="contacts-list overflow-y-auto max-h-[calc(100vh-150px)]">
      {filteredContacts.length > 0 ? (
        
        <div className="divide-y">
          
          {filteredContacts
            .sort((a, b) => {
              // Previous sorting logic remains the same
              // ... (keep the existing sorting logic)
            })
            .map((contact) => (
              <div
                key={contact.id || contact.phone}
                className={`p-4 hover:bg-gray-100 cursor-pointer flex justify-between items-center ${
                  selectedContact?.phone === contact.phone ? 'bg-blue-50' : ''
                }`}
                onClick={() => {
                  handleContactSelection(contact);
                  setShowContactsDrawer(false);
                }}
              >
                <div>
                  <p className="font-semibold">{contact.name || 'Unknown Name'}</p>
                  <p className="text-sm text-gray-500">{contact.phone || 'No Phone'}</p>
                </div>
                {contact.unreadCount > 0 && (
                  <span className="bg-blue-500 text-white rounded-full px-2 py-1 text-xs">
                    {contact.unreadCount}
                  </span>
                )}
              </div>
            ))
          }
        </div>
      ) : (
        <div className="p-4 text-center text-gray-500">No contacts found</div>
      )}
    </div>
  </div>

  {/* Main Chat Interface */}
  <div className="cb-main flex-grow relative">
    {/* Chat Header with Contact Selector */}
    {selectedContact ? (
      <div className="cb-chat-header flex justify-between items-center p-4 border-b">
        <div 
          className="flex items-center cursor-pointer"
          onClick={() => setShowContactsDrawer(true)}
        >
          {profileImage && typeof profileImage === 'string' ? (
            <img src={profileImage} alt="Profile" className="w-10 h-10 rounded-full mr-3" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
              {getInitials(selectedContact.name, selectedContact.last_name)}
            </div>
          )}
          <div>
            <span className="font-semibold">{selectedContact.name} {selectedContact.last_name}</span>
            <span className="block text-xs text-gray-500">{selectedContact.phone}</span>
          </div>
        </div>
        <ChevronRight onClick={() => setShowContactsDrawer(true)} className="text-gray-500" />
      </div>
    ) : (
      <div className="p-4 text-center text-gray-500">
        <Button onClick={() => setShowContactsDrawer(true)}>
          Select a Contact
        </Button>
      </div>
    )}

    {/* Pagination and Load More */}
    {selectedContact && visibleMessages.length > 0 && (
     <div className="load-more-container top-0 z-10 bg-white p-2 text-center">
        {hasMoreMessages && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadMoreMessages}
            className="mx-auto"
          >
            Load More Messages
          </Button>
        )}
      </div>
    )}

    {/* Message Container with Limited Messages */}
    <div className="cb-message-container overflow-y-auto flex-grow relative">
  {isLoading && (
    <div className="absolute inset-0 flex items-center justify-center z-50 bg-white bg-opacity-75">
      <div className="spinner border-4 border-blue-500 border-t-transparent rounded-full w-12 h-12 animate-spin"></div>
    </div>
  )}
  {visibleMessages.map((message, index) => (
    <div
      key={index}
      className={`cb-message ${message.sender === 'user' ? 'cb-user-message' : 'cb-bot-message'}`}
    >
      {(() => {
        if (typeof message.text === 'string') {
          if (message.text.trim().startsWith('{') || message.text.trim().startsWith('[')) {
            try {
              const fixedMessage = fixJsonString(message.text);
              const parsedMessage = JSON.parse(fixedMessage);
              return renderInteractiveMessage(parsedMessage);
            } catch (e) {
              console.error('Failed to parse message', e);
              return <div className="error">Failed to parse message</div>;
            }
          }
          return message.text || <div className="error">Message content is undefined</div>;
        }
        return <div className="error">null</div>;
      })()}
    </div>
  ))}
  <div ref={messageEndRef} />
</div>

    {/* Message Input Container */}
    <div
  className="cb-input-container sticky bottom-0 bg-white p-2 border-t flex flex-col md:flex-row items-end md:items-center"
  style={{ zIndex: '200' }}
>
  <div className="cb-input-actions flex items-center gap-2 w-full">
    <EmojiEmotionsIcon
      className="cb-action-icon"
      onClick={handleToggleSmileys}
    />
    <input
      type="file"
      accept="image/*"
      style={{ display: 'none' }}
      onChange={handleFileSelect}
      ref={fileInputRef}
    />
    <AttachFileIcon
      className="cb-action-icon"
      onClick={() => fileInputRef.current.click()}
    />
    <textarea
      value={(selectedContact && messageTemplates[selectedContact.id]) || ''}
      onChange={(e) => {
        if (selectedContact) {
          setMessageTemplates((prevTemplates) => ({
            ...prevTemplates,
            [selectedContact.id]: e.target.value,
          }));
        }
      }}
      placeholder="Type a message"
      className="cb-input-field flex-grow resize-none bg-gray-100 rounded-md p-2 border outline-none focus:ring-2 focus:ring-primary"
      rows={1}
    />
    <SendIcon className="cb-send-icon text-primary cursor-pointer" onClick={handleSend} />
  </div>

  {showSmileys && (
    <div className="cb-emoji-picker mt-2">
      <Picker onEmojiClick={handleSelectSmiley} />
    </div>
  )}
</div>

  </div>
</div>
      </div>
    <div className="hidden md:block">
     {isLoading && <FullPageLoader />}
     {authPopupp && <AuthPopup onClose={handleCloseAuthPopupp} />}
      <div className={`${showPopup ? 'filter blur-lg' : ''}`}>
        <div className="cb-container flex">
          {/* Contact List - Fixed width of 300px */}
          <Card className="w-[300px] border-r overflow-hidden">
            <CardHeader className="border-b p-4 flex flex-row items-center justify-between">
              <CardTitle>Contacts</CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowNewChatInput(!showNewChatInput)}
              >
                <Plus />
              </Button>
            </CardHeader>
            
            <div className="p-4 border-b">
        <div className="relative">
        <Search 
  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
  size={20} 
  onClick={handlePhoneSearch}
/>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search contacts"
            className="w-full pl-10"
          />
        </div>
      </div>
      
      {showNewChatInput && (
        <div className="p-4 border-b">
          <Input
            value={newPhoneNumber}
            onChange={(e) => setNewPhoneNumber(e.target.value)}
            placeholder="Enter phone number"
             className="w-full mb-2 border-blue-500 ring-2 ring-blue-200 focus:ring-blue-500"
          />
          <Button onClick={handleNewChat} className="w-full">
            Start New Chat
          </Button>
        </div>
      )}
      <div className="flex justify-center items-center space-x-2 p-4 border-t">
  <button 
    onClick={handlePreviousPage}
    disabled={currentPage === 1}
    className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
  >
    <ChevronLeft size={20} className="text-gray-600" />
  </button>
  
  <div className="flex items-center space-x-2">
    <input 
      type="number" 
      value={currentPage}
      onClick={(e) => e.target.select()}
      onChange={(e) => {
        const page = parseInt(e.target.value);
        if (!isNaN(page)) {
          setCurrentPage(page);
          handleGoToPage(page);
        }
      }}
      min="1"
      max={totalPages}
      className="w-16 text-center border rounded py-1 px-2"
    />
    <span className="text-gray-500">of {totalPages}</span>
  </div>
  
  <button 
    onClick={handleNextPage}
    disabled={currentPage === totalPages}
    className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
  >
    <ChevronRight size={20} className="text-gray-600" />
  </button>
</div>
      {/* Contact List */}
      <CardContent className="custom-scrollbar p-0 overflow-y-auto max-h-[calc(100vh-250px)]">
  <div className="divide-y">
    {filteredContacts.length > 0 ? (
      filteredContacts
        .sort((a, b) => {
          // Priority order of interaction
          const interactionPriority = [
            'last_replied',
            'last_seen',
            'last_delivered',
            'no_interaction'
          ];

          // Determine interaction status for each contact
          const getInteractionStatus = (contact) => {
            if (contact.last_replied) return 'last_replied';
            if (contact.last_seen) return 'last_seen';
            if (contact.last_delivered) return 'last_delivered';
            return 'no_interaction';
          };

          const aStatus = getInteractionStatus(a);
          const bStatus = getInteractionStatus(b);

          // First, sort by interaction priority
          const priorityDiff = interactionPriority.indexOf(aStatus) - 
                                interactionPriority.indexOf(bStatus);
          if (priorityDiff !== 0) return priorityDiff;

          // If same interaction status, sort by timestamp within that status
          switch (aStatus) {
            case 'last_replied':
              return new Date(b.last_replied).getTime() - 
                     new Date(a.last_replied).getTime();
            case 'last_seen':
              return new Date(b.last_seen).getTime() - 
                     new Date(a.last_seen).getTime();
            case 'last_delivered':
              return new Date(b.last_delivered).getTime() - 
                     new Date(a.last_delivered).getTime();
            default:
              // For no interaction, sort by unread count
              return (b.unreadCount || 0) - (a.unreadCount || 0);
          }
        })
        .map((contact) => (
          <div
            key={contact.id || contact.phone}
            className={`p-4 hover:bg-gray-100 cursor-pointer flex justify-between items-center ${
              selectedContact?.phone === contact.phone ? 'bg-blue-50' : ''
            }`}
            onClick={() => handleContactSelection(contact)}
          >
            <div>
              <p className="font-semibold">{contact.name || 'Unknown Name'}</p>
              <p className="text-sm text-gray-500">{contact.phone || 'No Phone'}</p>
              {/* Optional: Add interaction status hint */}
              <p className="text-xs text-gray-400">
                {contact.last_replied ? 'Replied' :
                 contact.last_seen ? 'Seen' :
                 contact.last_delivered ? 'Delivered' :
                 'No Interaction'}
              </p>
            </div>
            {contact.unreadCount > 0 && (
              <span className="bg-blue-500 text-white rounded-full px-2 py-1 text-xs">
                {contact.unreadCount}
              </span>
            )}
          </div>
        ))
    ) : (
      <div className="p-4 text-center text-gray-500">No contacts found</div>
    )}
  </div>
</CardContent>
          </Card>
          <div className="cb-main flex-grow">
    {selectedContact && (
  <div className="cb-chat-header">
  {selectedContact && (
  <div className="cb-chat-contact-info">
  {profileImage && typeof profileImage === 'string' ? (
    <img src={profileImage} alt="Profile" className="cb-profile-icon" />
  ) : (
    <div className={`cb-default-avatar`}>
      {getInitials(selectedContact.name, selectedContact.last_name)}
    </div>
  )}
  <div className="cb-contact-details">
    <span className="cb-contact-name">{selectedContact.name} {selectedContact.last_name}</span>
    <span className="cb-contact-phone">{selectedContact.phone}</span>
  </div>
  </div>
  )}

  </div>
  )}
    <div className="cb-message-container">
  {conversation.map((message, index) => (
  <div
    key={index}
    className={`cb-message ${message.sender === 'user' ? 'cb-user-message' : 'cb-bot-message'}`}
  >
    {(() => {
    
      if (typeof message.text === 'string') {
        if (message.text.trim().startsWith('{') || message.text.trim().startsWith('[')) {
          try {
            const fixedMessage = fixJsonString(message.text);
            const parsedMessage = JSON.parse(fixedMessage);
            // console.log('Parsed Message:', parsedMessage);
            return renderInteractiveMessage(parsedMessage);
          } catch (e) {
            const fixedMessage = fixJsonString(message.text);
            console.log("Fixed Message: ", fixedMessage)
            const parsedMessage = JSON.parse(fixedMessage);
            console.error(`Failed to parse JSON message: ${JSON.stringify(parsedMessage, null, 4)}`, e);
            return <div className="error">Failed to parse message</div>;
          }
        }
        return renderMessageWithNewLines(message.text) || <div className="error">Message content is undefined</div>;
      }else if (typeof message.text === 'object' && message.text !== null) {
        // Handle non-string message formats
        return renderMessageContent(message);
      }
      return <div className="erro">Please Select a contact</div>;
    })()}
  </div>
  ))}
  <div ref={messageEndRef} />
  </div>
  <div className="cb-input-container">
  <div className="cb-input-actions">
    <EmojiEmotionsIcon className="cb-action-icon" onClick={handleToggleSmileys} />
    <input
      type="file"
      accept="image/*"
      style={{ display: 'none' }}
      onChange={handleFileSelect}
      ref={fileInputRef}
    />
    <AttachFileIcon className="cb-action-icon" onClick={() => fileInputRef.current.click()} />
  </div>
  <textarea
    value={selectedContact && messageTemplates[selectedContact.id] || ''}
    onChange={(e) => {
      if (selectedContact) {
        setMessageTemplates(prevTemplates => ({
          ...prevTemplates,
          [selectedContact.id]: e.target.value
        }));
      }
    }}
    onKeyDown={(e) => {
      if (e.key === 'Enter' && !e.shiftKey) { // Send on Enter, ignore if Shift+Enter
        e.preventDefault(); // Prevent new line from being added
        handleSend();
      }
    }}
    placeholder="Type a message"
    className="cb-input-field"
  />
  <SendIcon className="cb-send-icon" onClick={handleSend} />
</div>

      {showSmileys && (
        <div className="cb-emoji-picker">
          <Picker onEmojiClick={handleSelectSmiley} />
        </div>
      )}
    </div>
    <Card className="w-[350px]">
      <Tabs defaultValue="contact">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="ai-actions">AI Actions</TabsTrigger>
        </TabsList>
        
        {/* Contact Details Tab */}
        <TabsContent value="contact">
          <CardContent className="space-y-4">
            {selectedContact && (
              <>
                <div className="flex flex-col items-center">
                  {profileImage && typeof profileImage === 'string' ? (
                    <img 
                      src={profileImage} 
                      alt="Profile" 
                      className="w-24 h-24 rounded-full mb-4"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-3xl mb-4">
                      {getInitials(selectedContact.name, selectedContact.last_name)}
                    </div>
                  )}
                  <h2 className="text-xl font-semibold">
                    {selectedContact.name} {selectedContact.last_name}
                  </h2>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Phone className="text-gray-500" size={20} />
                    <span>{selectedContact.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="text-gray-500" size={20} />
                    <span>{selectedContact.email}</span>
                  </div>
                </div>
              </>
            )}

            {/* Flow Selection */}
            <div className="space-y-2">
              <Select 
                value={selectedFlow} 
                onValueChange={setSelectedFlow}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a flow" />
                </SelectTrigger>
                <SelectContent>
                  {flows.map(flow => (
                    <SelectItem key={flow.id} value={flow.id}>
                      {flow.name || flow.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                className="w-full" 
                onClick={handleSendFlowData} 
                disabled={isSending}
              >
                {isSending ? "Sending..." : "Send Flow Data"}
              </Button>
            </div>
          </CardContent>
        </TabsContent>

        {/* AI Actions Tab */}
        <TabsContent value="ai-actions">
          <CardContent className="space-y-4">
            <Input 
              type="file" 
              onChange={handleFileChange}
              className="mb-4"
            />
            
            <div className="space-y-2">
              {inputFields.map((field, index) => (
                <div key={index} className="flex space-x-2">
                  <Input 
                    value={field.value}
                    onChange={(e) => handleInputChange(index, e)}
                    placeholder="Enter content description" 
                    className="flex-1"
                  />
                  <Button 
                    variant="destructive" 
                    size="icon"
                    onClick={() => deleteInputField(index)}
                  >
                    <X />
                  </Button>
                </div>
              ))}
              
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={addInputField}
              >
                <Plus className="mr-2" /> Add Description
              </Button>
              
              <Button 
                className="w-full" 
                onClick={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </Button>
              
              {uploadStatus && (
                <p className={uploadStatus.includes('Error') ? 'text-red-500' : 'text-green-500'}>
                  {uploadStatus}
                </p>
              )}
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
    {showImagePreview && (
    <div className="cb-image-preview-overlay">
      <div className="cb-image-preview-container">
        <CloseIcon className="cb-close-preview" onClick={() => setShowImagePreview(false)} />
        <img src={imageMap[imageToSend]} alt="Preview" className="cb-preview-image" />
        <textarea
          value={imageCaption}
          onChange={(e) => setImageCaption(e.target.value)}
          placeholder="Add a caption..."
          className="cb-image-caption-input"
        />
        <button 
          className="cb-send-image-btn" 
          onClick={handleImageSend}
          // disabled={isUploading || !blobUrl}
        >
          {isUploading ? "Uploading..." : "Send"}
        </button>
      </div>
    </div>
  )}
  </div>
  </div>
 </div>
  </div>
  );

};

export default Chatbot;
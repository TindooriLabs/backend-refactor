const config = {
    conversation: {
      pageLength: 10000 //UI currently does not respect pagination, so this is currently a big number M. once pagination is implemented on the front end, this can be something in the 20-50 range
    },
    images: {
      maxProfileImages: 4,
      compressionQuality: 70
    },
    subscriptionToggles: {
      previewRelationshipType: ["PREMIUM"],
      swipeLimit: {
        FREE: {
          windowLength: 24, //hours
          numSwipes: 30
        }
      }
    },
    bcrypt: {
      saltRounds: 10
    },
    translations: {
      googleTranslateCacheDays: 15 //legal maximum per google ToS
    },
    mobile: {
      verificationCodeExpiration: 10 //minutes
    }
  };
  
  export default config;
  
import NextAuth, { type DefaultSession, type Profile } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      image?: string | null;
    } & DefaultSession["user"];
  }
}

interface GoogleProfile extends Profile {
  picture?: string;
  image_url?: string;
  avatar_url?: string;
}

// Your Google Apps Script Webhook URL
const GOOGLE_SHEETS_WEBHOOK_URL = process.env.GOOGLE_SHEETS_WEBHOOK_URL || "";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      profile(profile: GoogleProfile) {
        if (!profile.sub || !profile.email) {
          throw new Error('Google profile is missing required fields');
        }
        return {
          id: profile.sub,
          name: profile.name ?? profile.email.split('@')[0],
          email: profile.email,
          image: profile.picture || profile.image_url || profile.avatar_url || null,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        // Include the user's image from the token if available
        if (token.picture) {
          session.user.image = token.picture;
        } else if (token.image && typeof token.image === 'string') {
          session.user.image = token.image;
        }
      }
      return session;
    },
    async jwt({ token, user, account, profile }) {
      // Initial sign in
      if (account && user) {
        // Include the user's image from the provider
        const googleProfile = profile as GoogleProfile | undefined;
        if (googleProfile?.picture) {
          token.picture = googleProfile.picture;
        } else if (googleProfile?.image_url) {
          token.picture = googleProfile.image_url;
        } else if (googleProfile?.avatar_url) {
          token.picture = googleProfile.avatar_url;
        }
      }
      return token;
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser = false }) {
      console.log('=== SignIn Event Triggered ===');
      console.log('User:', JSON.stringify(user, null, 2));
      console.log('Account:', JSON.stringify(account, null, 2));
      console.log('Profile:', JSON.stringify(profile, null, 2));
      console.log('isNewUser:', isNewUser);
      console.log('Has Webhook URL:', !!GOOGLE_SHEETS_WEBHOOK_URL);
      
      if (!GOOGLE_SHEETS_WEBHOOK_URL) {
        console.error('GOOGLE_SHEETS_WEBHOOK_URL is not set');
        return;
      }

      try {
        const userData = {
          email: user.email || 'no-email@example.com',
          name: user.name || 'Anonymous',
          provider: account?.provider || 'unknown',
          userId: user.id || 'no-id',
          image: user.image || null,
          isNewUser: isNewUser,
          timestamp: new Date().toISOString()
        };

        console.log('Sending data to Google Sheets:', JSON.stringify(userData, null, 2));

        // Create a new request with all necessary headers
        const response = await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Vocably-Server/1.0'
          },
          body: JSON.stringify(userData),
          redirect: 'follow',
          referrerPolicy: 'no-referrer'
        });

        // Log the response status
        console.log('Response status:', response.status, response.statusText);
        
        // Get the response text
        const responseText = await response.text();
        console.log('Response body:', responseText);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
        }

        // Try to parse the response as JSON
        try {
          const responseData = JSON.parse(responseText);
          console.log('Successfully logged to Google Sheets:', responseData);
        } catch (parseError) {
          console.log('Non-JSON response received:', responseText);
        }
      } catch (error) {
        console.error('Error in Google Sheets webhook:', error);
        // Log the full error for debugging
        console.error('Error details:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    },
  },
});

export { handler as GET, handler as POST };
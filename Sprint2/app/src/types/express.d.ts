import 'express';
declare global{
    namespace Express{
        interface Request{
            user?:{
                id:string;
                email: string;
                firstName?: string | null;
                lastName?: string | null;
                role:'student'|'organizer'|'admin';
                organizerStatus?: 'pending'|'approved'|'denied'|'revoked';
            };
            sessionToken?: string;
            session?: {
                id: string;
                expiresAt: Date;
            };
        }
    }
}
export{};
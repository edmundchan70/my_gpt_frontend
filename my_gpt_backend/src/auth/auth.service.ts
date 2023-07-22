import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './DTO';
import *  as bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt';
 
@Injectable()
export class AuthService {
    constructor(private prisma : PrismaService,
        private jwtService : JwtService
        ){}
    hashData(data:string ){
        return bcrypt.hash(data,10);
    }
    async signupLocal(Body : AuthDto){
        const hash = await this.hashData(Body.password);
        const newUser = await this.prisma.user.create({
            data:{
                email: Body.email,
                hash: hash
            }
        })
        const tokens = await this.getToken(
            newUser.id,
            newUser.email
        )
        await this.updateRtHash(newUser.id,tokens.refresh_token)
        return tokens
    } 
    async getToken(userId:number , email :string){
        const [at,rt] = await Promise.all([
            this.jwtService.signAsync({
                sub:userId,
                email: email
            }, {
                secret: process.env.AT_SECRET,
                expiresIn: 60*15
            }
        ),
        this.jwtService.signAsync({
            sub:userId,
            email: email
        }, {
            secret: process.env.RT_SECRET,
            expiresIn: 60*60*24*7
        }
    )
        ])
    
        return {
            access_token :at,
            refresh_token: rt
        }

       
    }
    async updateRtHash(userId: number , refreshToken:string){
         const hash = await this.hashData(refreshToken);
         await this.prisma.user.update({
            where:{
                 id:userId,
            },
            data:{
                hashedRT:hash
            }
         })
    } 
    async signInLocal( Body : AuthDto){
        const user = await this.prisma.user.findUnique({
            where:{
                email:Body.email
            }
        })
        if (!user) throw new ForbiddenException("USER NOT FOUND, Check your email");
        const passwordMatches = await bcrypt.compare(Body.password , user.hash);
        if(!passwordMatches)  throw new ForbiddenException("WRONG_CREDENTIALS. Check your email&password");
        
        //finish validating user
        const tokens = await this.getToken(user.id,user.email);
        await this.updateRtHash(user.id,tokens.refresh_token);
        return  tokens
    } 
    async logOut(userId:number){
        await this.prisma.user.updateMany({
        where:{
            id: userId,
            hashedRT:{not:null}
        },data:{
            hashedRT: null
        }})
    }
    async refreshTokens(userId: number , refresh_token :string){
        const user = await this.prisma.user.findUnique({
            where:{
                id:userId
            }
        })
        if(!user) throw new ForbiddenException("NO USER FOUND");
        const rtMatches = await bcrypt.compare(refresh_token,user.hashedRT);
        if(!rtMatches) throw new ForbiddenException("Access denied(Hashes error)")
        //validation complete, update new rtHash
        const tokens = await this.getToken(user.id,user.email);
        await this.updateRtHash(user.id, tokens.refresh_token);
        return tokens; 

    }    
}

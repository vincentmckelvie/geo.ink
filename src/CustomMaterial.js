import {
    ConeGeometry,
    MeshBasicMaterial,
    MeshStandardMaterial,
    Euler,
    Mesh,
    SphereGeometry,
    ShaderMaterial,
    Color,
    BackSide, 
    Vector3
} from './build/three.module.js';

class CustomMaterial {
    
    constructor(OBJ){
        this.all = [];
        this.inc = 0;

    }

    update(OBJ){
        this.inc+=OBJ.delta*2;
        
        for(let i =0; i < this.all.length; i++){
            if(this.all[i].mat.userData.shader!=null){
              this.all[i].mat.userData.shader.uniforms.time.value = this.inc;
            }
        }
    }
    // makeNewMaterial(OBJ){
    //     this.getCustomMaterial(OBJ.material);
    // }

    getCustomMaterial(mat, param) {

        //const material = mat.clone();
        const col = mat.color.clone();

        mat.onBeforeCompile = function (shader) {

            shader.uniforms.time = { value: 0};
            shader.uniforms.col = { value: col};
            shader.uniforms.twistAmt = { value: param.twistAmt};
            shader.uniforms.noiseSize = { value: param.noiseSize};
            shader.uniforms.twistSize = { value: param.twistSize};
            shader.uniforms.noiseAmt = { value: param.noiseAmt};
            shader.uniforms.rainbowAmt = { value: param.rainbowAmt};
            shader.uniforms.gradientSize = { value: param.gradientSize};
            shader.uniforms.rainbowGradientSize = { value: param.rainbowGradientSize};
            shader.uniforms.gradientOffset = { value: param.gradientOffset};
            shader.uniforms.topColor = { value: param.topColor};
            shader.uniforms.bottomColor = { value: param.bottomColor};
            shader.uniforms.deformSpeed = { value: param.deformSpeed};
            shader.uniforms.colorSpeed = { value: param.colorSpeed};
            
            shader.vertexShader = `
                uniform float time;
                varying vec3 vPos;
                varying vec3 vnorm;
                varying vec3 vsn;
                varying vec3 vPositionW;
                varying vec3 vNormalW;
                varying float nse;
                uniform float twistAmt;
                uniform float noiseSize;
                uniform float noiseAmt;
                uniform float twistSize;
                uniform float deformSpeed;
              

                float hash(float n) {
                    return fract(sin(n)*43758.5453);
                }
                float noise(vec2 p) {
                    return hash(p.x + p.y*57.0);
                }
                float valnoise(vec2 p) {
                    vec2 c = floor(p);
                    vec2 f = smoothstep(0.,1.,fract(p));
                    return mix (mix(noise(c+vec2(0,0)), noise(c+vec2(1,0)), f.x), mix(noise(c+vec2(0,1)), noise(c+vec2(1,1)), f.x), f.y);
                }
                
                ${shader.vertexShader}
            `.replace(
                `#include <begin_vertex>`,
                `#include <begin_vertex>
                
                vec4 world = vec4(modelMatrix * vec4(position, 1.0));
                vPos = vec3(world.xyz) ;
                float n = valnoise( vec2( ( vPos.x * ( noiseSize ) ), ( vPos.y * ( noiseSize ) )+( time*deformSpeed ))) * ( noiseAmt );
                vsn = vec3( projectionMatrix  * modelViewMatrix  * vec4(vNormal, 0.0));
                vnorm = vec3(vec4(vNormal, 0.0));
                vPositionW = normalize(vec3(modelViewMatrix * vec4(position, 1.0)).xyz);
                vec3 view_space_normal = vec3(projectionMatrix  * modelViewMatrix  * vec4(vNormal, 0.0));
                vNormalW = normalize(normalMatrix * normal);


                float theta = sin( (time*deformSpeed) + ( vPos.y * ( twistSize ) ) ) * ( twistAmt );
                float c = cos( theta );
                float s = sin( theta );
                mat3 m = mat3( c, 0, s, 0, 1, 0, -s, 0, c );
                //transformed = vec3( position + ( (view_space_normal*n) ));
                transformed = vec3( position ) * ( m ) + ( (n) );
                vNormal = vNormal * m;
                `
            );
            shader.fragmentShader = 
                'uniform float time;\n'+  
                'uniform vec3 col;\n '+
                'varying vec3 vPos;\n '+
                'varying vec3 vnorm;\n'+
                'varying vec3 vsn;\n' +
                'varying vec3 vPositionW;\n' +
                'varying vec3 vNormalW;\n' +
                'varying float nse;\n' +
                'uniform float twistAmt;\n' +
                'uniform float noiseSize;\n' +
                'uniform float twistSize;\n' +
                'uniform float rainbowAmt;\n' +
                'uniform vec3 topColor;\n' +
                'uniform vec3 bottomColor;\n' +
                'uniform float gradientSize;\n' +
                'uniform float gradientOffset;\n' +
                'uniform float rainbowGradientSize;\n' +
                'uniform float colorSpeed;\n' +
                'uniform float deformSpeed;\n' +
              
                shader.fragmentShader;
                shader.fragmentShader = shader.fragmentShader.replace(
                    //'#include <map_fragment>',
                    'vec4 diffuseColor = vec4( diffuse, opacity );',
                    `
                    vec4 ogColor = vec4(col.xyz,1.);//texture2D( map, vUv );
                    
                    vec3 color = vec3(1., 1., 1.);
                    vec3 viewDirectionW = normalize(cameraPosition - vPositionW);
                    float fresnelTerm = ( 1.0 - -min(dot(vPositionW, normalize(vNormalW)*2.4 ), 0.0) ); 

                    vec3 trip = ogColor.rgb;
                    trip.x *= (( .5 + sin( (0.0 *1.) +  ((vPos.y*rainbowGradientSize) + (time*colorSpeed) ) )*.5 ) *1.);
                    trip.y *= (( .5 + sin( (6.28*.33) + ((vPos.y*rainbowGradientSize) + (time*colorSpeed) ) )*.5 ) *1.);
                    trip.z *= (( .5 + sin( (6.28*.66) + ((vPos.y*rainbowGradientSize) + (time*colorSpeed) ) )*.5 ) *1.);

                    float h = normalize( vPos + gradientOffset ).y;
                    float gradientMix =  max( pow( max( h, 0.0 ), gradientSize ), 0.0 );
                    vec3 gradient = ogColor.xyz * mix( vec4(bottomColor.xyz, 1.), vec4(topColor.xyz,1.),  gradientMix ).xyz;
                    
                    vec3 fnl = mix(vec4(gradient.xyz,1.), vec4(trip.xyz,1.), rainbowAmt).xyz;
                
                    vec4 diffuseColor = vec4( fnl.xyz, opacity );
                `);
            mat.userData.shader = shader;
        }  

        this.all.push({mat:mat, param:param});
        return mat;

    }


}

export { CustomMaterial };